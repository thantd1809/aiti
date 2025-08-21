import json
import re

from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi import Request
from fastapi.responses import StreamingResponse
import uuid
from langchain_core.tracers.log_stream import RunLogPatch

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.chat import DeleteChatHistoryRequest, ChatHistoryRequest, UpdateFeedbackRequest, ChatStreamLogRequest, ChatStreamRequest
from app.logic.chat import ChatLogic
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.logic.chain import get_chain_for_user
from app.core.constants import CHAT
from app.logic.get_data import GetDataLogic

auth_handler = Auth
security = HTTPBearer()
chat_route = APIRouter()

# Add chat routes with user-specific chain


@chat_route.post("/chat/stream", tags=[CHAT])
async def stream_chat(
    stream_request: ChatStreamRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Chat API endpoint with streaming using user-specific permissions

    This endpoint streams the output of the chatbot as it's generated.
    The endpoint uses server sent events to stream the output.
    """
    try:
        

        # Get user from token
        user = BaseApi(token=credentials.credentials).verify(db)

        # Get user-specific chatbot chain with requested language
        user_chain = get_chain_for_user(user.id)

        # Use the validated request body from Pydantic
        body = stream_request.dict()

        # Setup stream generator with LangServe-compatible format
        async def stream_generator():
            try:
                async for chunk in user_chain.astream_events(
                    input=body.get("input", {}),
                    config=body.get("config", {}),
                    version="v1",
                    **body.get("kwargs", {})
                ):
                    data = {"event": "data", "data": chunk}
                    yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

                # End event
                yield f"data: {json.dumps({'event': 'end'}, ensure_ascii=False)}\n\n"
            except Exception as stream_ex:
                # Format error exactly as langserve would
                error_data = {
                    "event": "error",
                    "data": {
                        "status_code": 500,
                        "message": str(stream_ex)
                    }
                }
                yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"

        # Return streaming response with proper headers
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    except Exception as ex:
        # Return properly formatted error for SSE
        async def error_generator():
            error_data = {
                "event": "error",
                "data": {
                    "status_code": 500,
                    "message": str(ex)
                }
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"

        return StreamingResponse(
            error_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )


@chat_route.post("/chat/stream_log", tags=[CHAT])
async def stream_log_chat(
    stream_request: ChatStreamLogRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Chat API endpoint with streaming logs using user-specific permissions

    This endpoint allows to stream the output of the runnable, including intermediate steps.
    The endpoint uses server sent events to stream the output.

    The response format includes:
    - data events: For streaming output chunks
    - error events: For signaling errors
    - end event: For signaling the end of the stream
    """
    try:
        # Get user from token
        user = BaseApi(token=credentials.credentials).verify(db)
        data_logic = GetDataLogic(db)
        files_ids = []
        if stream_request.folder_ids:
            files_ids.extend(
                data_logic.get_all_files_in_folder_and_sub_folder(
                    stream_request.folder_ids
                )
            )
        if stream_request.file_ids:
            files_ids.extend(stream_request.file_ids)

        accessible_file_ids = data_logic.get_all_accessible_files(user.id)
        
        if files_ids:
            list_access = set(files_ids) - accessible_file_ids
            if list_access:
                return OutputResponse.error(
                        msg="There is some file has no permission to view"
                    )
        else:
            files_ids = list(accessible_file_ids)

        user_chain = get_chain_for_user(user.id, files_ids)

        # Use the validated request body from Pydantic
        body = stream_request.dict()

        # Setup stream generator - format to match the expected LangChain format exactly
        async def stream_generator():
            try:
                # Initialize with run ID
                run_id = str(uuid.uuid4())

                # Initial state setup
                yield f"event: data\ndata: {json.dumps({'ops':[{'op':'replace','path':'','value':{'id':run_id,'streamed_output':[],'final_output':None,'logs':{},'name':'/chat','type':'chain'}}]}, ensure_ascii=False)}\n\n"

                # Initialize output
                yield f"event: data\ndata: {json.dumps({'ops':[{'op':'add','path':'/streamed_output/-','value':''},{'op':'replace','path':'/final_output','value':''}]}, ensure_ascii=False)}\n\n"

                accumulated_text = ""
                include_names = body.get("include_names", [])
                finddocs_log_sent = False
                finddocs_final_output_sent = False
                finddocs_end_time_sent = False

                async for chunk in user_chain.astream_log(
                    input=body.get("input", {}),
                    config=body.get("config", {}),
                    include_names=include_names,
                    include_types=body.get("include_types", []),
                    include_tags=body.get("include_tags", []),
                    exclude_names=body.get("exclude_names", []),
                    exclude_types=body.get("exclude_types", []),
                    exclude_tags=body.get("exclude_tags", []),
                    **body.get("kwargs", {})
                ):
                    text_chunk = ""
                    if isinstance(chunk, RunLogPatch):
                        for op in chunk.ops:
                            # Handle FindDocs log event
                            if (
                                op.get("op") == "add"
                                and op.get("path") == "/logs/FindDocs"
                                and "FindDocs" in include_names
                                and not finddocs_log_sent
                            ):
                                finddocs_log_sent = True
                                # Gửi event add log FindDocs
                                yield f"event: data\ndata: {json.dumps({'ops':[op]}, ensure_ascii=False)}\n\n"
                            # Handle FindDocs final_output event
                            if (
                                op.get("op") == "add"
                                and op.get("path") == "/logs/FindDocs/final_output"
                                and "FindDocs" in include_names
                                and not finddocs_final_output_sent
                            ):
                                finddocs_final_output_sent = True
                                # Get output as a list of documents
                                output = op["value"].get("output", [])
                                # Get fields needed: page_content, metadata (source, title), type
                                docs = []
                                for doc in output:
                                    # If it is a dict, keep it as is. If it is a Document, get the properties.
                                    if isinstance(doc, dict):
                                        page_content = doc.get("page_content", "")
                                    else:
                                        page_content = getattr(doc, "page_content", "")
                                    # Remove timestamp prefix if present (eg: 2025-06-18T04:55:00.045+00:00...)
                                    page_content = str(page_content)
                                    page_content = re.sub(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}", "", page_content)
                                    if isinstance(doc, dict):
                                        docs.append({
                                            "page_content": page_content,
                                            "metadata": {
                                                "source": doc.get("metadata", {}).get("source", ""),
                                                "title": doc.get("metadata", {}).get("title", "")
                                            },
                                            "type": doc.get("type", "Document")
                                        })
                                    else:
                                        docs.append({
                                            "page_content": page_content,
                                            "metadata": {
                                                "source": getattr(getattr(doc, "metadata", {}), "get", lambda k, d=None: d)("source", ""),
                                                "title": getattr(getattr(doc, "metadata", {}), "get", lambda k, d=None: d)("title", "")
                                            },
                                            "type": getattr(doc, "type", "Document")
                                        })
                                # Send event add log FindDocs/final_output
                                yield f"event: data\ndata: {json.dumps({'ops':[{'op':'add','path':'/logs/FindDocs/final_output','value':{'output': docs}}]}, ensure_ascii=False)}\n\n"
                            # Handle FindDocs end_time event
                            if (
                                op.get("op") == "add"
                                and op.get("path") == "/logs/FindDocs/end_time"
                                and "FindDocs" in include_names
                                and not finddocs_end_time_sent
                            ):
                                finddocs_end_time_sent = True
                                # Send event add log FindDocs/end_time
                                yield f"event: data\ndata: {json.dumps({'ops':[op]}, ensure_ascii=False)}\n\n"
                            # Process streamed output as before
                            if op.get("op") == "add" and "value" in op:
                                value = op.get("value")
                                if isinstance(value, dict) and "chunks" in value:
                                    for c in value.get("chunks", []):
                                        if c.get("text"):
                                            text_chunk = c.get("text")
                                            break
                                elif isinstance(value, dict) and "output" in value:
                                    text_chunk = value.get("output", "")
                                elif isinstance(value, str):
                                    text_chunk = value
                    if text_chunk:
                        # Remove timestamp prefix if present at the beginning of text_chunk
                        text_chunk = str(text_chunk)
                        text_chunk = re.sub(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2}", "", text_chunk)
                        accumulated_text += text_chunk
                        output = {
                            'ops': [
                                {'op': 'add', 'path': '/streamed_output/-',
                                    'value': text_chunk},
                                {'op': 'replace', 'path': '/final_output',
                                    'value': accumulated_text}
                            ]
                        }
                        yield f"event: data\ndata: {json.dumps(output, ensure_ascii=False)}\n\n"

                # Add empty string to end the stream properly
                yield f"event: data\ndata: {json.dumps({'ops':[{'op':'add','path':'/streamed_output/-','value':''}]}, ensure_ascii=False)}\n\n"

                # End event
                yield f"event: end\ndata: \n\n"

            except Exception as stream_ex:
                # Format error for event stream format
                error_data = {
                    "status_code": 500,
                    "message": str(stream_ex)
                }
                yield f"event: error\ndata: {json.dumps(error_data, ensure_ascii=False)}\n\n"

        # Return streaming response with proper headers
        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    except Exception as ex:
        # Return properly formatted error for SSE
        async def error_generator(ex):
            error_data = {
                "status_code": 500,
                "message": str(ex)
            }
            yield f"event: error\ndata: {json.dumps(error_data, ensure_ascii=False)}\n\n"

        return StreamingResponse(
            error_generator(ex),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )


@chat_route.get('/chat', tags=[CHAT])
async def chat(credentials: HTTPAuthorizationCredentials = Security(security),
               db: Session = Depends(get_db), search: str = None, page: int = 1, limit: int = 10
               ):
    """
    Get all history chat API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        chat_logic = ChatLogic(db)
        response = chat_logic.get_all(user.id, search, page, limit)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@chat_route.get('/chat/{chat_id}', tags=[CHAT])
async def chat(chat_id: str,
               credentials: HTTPAuthorizationCredentials = Security(security),
               db: Session = Depends(get_db)):
    """
    Get a history chat by id API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        chat_logic = ChatLogic(db)
        response = chat_logic.get(chat_id, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@chat_route.post('/chat', tags=[CHAT])
async def chat(request: ChatHistoryRequest,
               credentials: HTTPAuthorizationCredentials = Security(security),
               db: Session = Depends(get_db)):
    """
    Create history chat API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        chat_logic = ChatLogic(db)
        response = chat_logic.create(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@chat_route.delete('/chat', tags=[CHAT])
async def chat(request: DeleteChatHistoryRequest,
               credentials: HTTPAuthorizationCredentials = Security(security),
               db: Session = Depends(get_db)):
    """
    Delete history chat API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        chat_logic = ChatLogic(db)
        response = chat_logic.delete(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@chat_route.patch("/feedback", tags=[CHAT])
async def update_feedback(request: UpdateFeedbackRequest,
                          credentials: HTTPAuthorizationCredentials = Security(
                              security),
                          db: Session = Depends(get_db)):
    """
    Update feedback API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        chat_logic = ChatLogic(db)
        response = chat_logic.update_talk_evaluation(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@chat_route.post("/chat/invoke", tags=[CHAT])
async def invoke_chat(request: Request, credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    """Chat API endpoint without streaming using user-specific permissions"""
    try:
        # Get user from token
        user = BaseApi(token=credentials.credentials).verify(db)

        # Get user-specific chatbot chain
        user_chain = get_chain_for_user(user.id)

        # Forward to langserve invoke endpoint with user's chain
        body = await request.json()
        return user_chain.invoke(body)
    except Exception as ex:
        return {"error": str(ex)}
