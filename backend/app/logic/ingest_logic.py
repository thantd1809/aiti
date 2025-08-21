"""
Ingest logic module
Load document from files, split, ingest into DB.
"""
import os
import datetime

from langchain.vectorstores.pgvector import PGVector
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import S3FileLoader
from langchain.schema.embeddings import Embeddings
from langchain.indexes import SQLRecordManager, index
from langchain.embeddings import OpenAIEmbeddings

from app.core.constants import PG_DOCS_INDEX_NAME
from app.core.config import settings
from app.core.logger import logging


logger = logging.getLogger(__name__)


class IngestLogic:
    """
    Ingest logic class
    """

    def __init__(self):
        # Get embedding
        self.embedding = self.get_embeddings_model(self)

        # Init the Vector store for document embedding
        self.vector_store = PGVector(
            connection_string=settings.DATABASE_URL,
            collection_name=settings.COLLECTION_NAME,
            embedding_function=self.embedding
        )

        # Indexing + Record Management:To do this without having to re-index all of our documents from scratch every time
        # This uses a RecordManager to track writes to any vector store and handles deduplication and cleanup of documents from the same source.
        # Auto generate a table name: "insertion_record"
        self.record_manager = SQLRecordManager(
            f"pgvector/{PG_DOCS_INDEX_NAME}", db_url=settings.DATABASE_URL
        )
        self.record_manager.create_schema()

    @staticmethod
    def get_embeddings_model(self) -> Embeddings:
        """
        Returns the embeddings model to be used for the retriever.
        """
        try:
            return OpenAIEmbeddings(chunk_size=200)
        except Exception as ex:
            raise ex


    def delete(self, file_ids: list[str]) -> bool:
        """
        Delete vectordb(embedding) and record_manager
        """
        try:
            # Convert file_ids to string if they are not already
            file_ids = [str(file_id) for file_id in file_ids]

            result_key = self.record_manager.list_keys(
                group_ids=file_ids)
            # Delete keys
            if result_key is not None:
                self.vector_store.delete(ids=result_key)
                self.record_manager.delete_keys(keys=result_key)
            return True
        except Exception as ex:
            raise ex

    @staticmethod
    def load_doc(self, file_path, file_id):
        """
        Load a single document from MinIO

        Args:
            file_path: Path or key to the file in MinIO
            file_id: ID of the uploaded file

        Returns:
            Document object with content and metadata
        """
        try:
            loader = S3FileLoader(
                settings.MINIO_BUCKET, file_path,
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
                use_ssl=False,
                endpoint_url=f"http://{settings.MINIO_URL}"
            )
            docs = loader.load()

            # Add file_id to metadata
            if docs and len(docs) > 0:
                docs[0].metadata["file_id"] = file_id
                return docs[0]

            return None
        except Exception as ex:
            logger.error(
                f"Error loading document from MinIO: {file_path}", exc_info=True)
            raise ex

    def ingest_doc(self, file_path, file_id, file_name, user_id=None, cleanup=None, url=None):
        """
        Ingest a single document into DB.

        Args:
            file_path: Path/key to the file in MinIO storage
            file_id: ID of the uploaded file
            user_id: ID of the user who uploaded the file
            cleanup: Cleanup strategy for record manager (None, 'incremental', or 'full')

        Returns:
            bool: True if ingestion was successful

        Raises:
            Exception: If any error occurs during ingestion
        """
        try:
            # Load the single document
            doc = self.load_doc(self, file_path, file_id=file_id)

            if not doc:
                logger.warning(
                    f"No document loaded from file path: {file_path}")
                return False

            logger.info(
                f"Preparing to ingest document with file_id: {file_id}")

            # Chunk data
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=4000, chunk_overlap=200)
            splitted_docs = text_splitter.split_documents([doc])

            logger.info(
                f"Split into {len(splitted_docs)} chunks for processing")

            # Ensure required metadata fields and add file_id and user_id
            for chunk in splitted_docs:
                # Preserve existing metadata but ensure required fields
                chunk.metadata["source"] = url
                if "title" not in chunk.metadata:
                    chunk.metadata["title"] = file_name

                # Add file_id for tracking and future reference
                chunk.metadata["file_id"] = file_id

                # Add user_id for permission enforcement
                if user_id is not None:
                    chunk.metadata["user_id"] = user_id

                # Add timestamp for tracking when document was ingested
                chunk.metadata["ingested_at"] = str(datetime.datetime.now())

            logger.info(f"Starting indexing of document: {file_name}")

            # Index the documents
            indexing_stats = index(
                splitted_docs,
                self.record_manager,
                self.vector_store,
                cleanup=cleanup,
                source_id_key="file_id",
                force_update=(
                    os.environ.get("FORCE_UPDATE") or "false").lower() == "true",
            )

            logger.info(
                f"Indexing completed successfully. Stats: {indexing_stats}")
            return True

        except Exception as ex:
            logger.error(
                f"Error during document ingestion: {str(ex)}", exc_info=True)
            raise ex
