PG_DOCS_INDEX_NAME = "LangChain_index_docs"

# How to handle clean up of documents.
# value: "incremental", "full"
# - Incremental: Cleans up all documents that haven't been updated AND that are associated with source ids that were seen during indexing.
#   Clean up is done continuously during indexing helping to minimize the probability of users seeing duplicated content.
# - Full: Delete all documents that haven to be returned by the loader.
#   Clean up runs after all documents have been indexed. This means that users may see duplicated content during indexing.
# - None: Do not delete any documents.
# CLEANUP_TYPE = None
# CLEANUP_TYPE = "incremental"
# CLEANUP_FULL_TYPE = "full"

# Response Prompt



# Rephrase prompt
REPHRASE_TEMPLATE = """\
Given the following conversation and a follow up question, rephrase the follow up \
question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone Question:"""


# Summarize first the prompt content
NUMBER_CHARACTERS_SUMMARIZE = 50
NUMBER_BYTE_SUMMARIZE = 96


# Secret string to encode & decode token auth
# access token expire
ACCESS_TOKEN_EXP = 30  # 30 minutes
# refresh token expire
REFRESH_TOKEN_EXP = 90  # 90 minutes(1.5 hour)
# 管理者：1, 一般：2
ADMIN_ROLE = 1
GENERAL_ROLE = 2
USER_ROLES = [1, 2]

# embedding_files
EMBEDDING_FOLDER = '../embedding_files_100'
# embedding_status
NOT_YET_EMBEDDING_STATUS = 0
RESERVED_EMBEDDING_STATUS = 1
IMPORTED_EMBEDDING_STATUS = 2

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


# Email content
SERVER_EMAIL = "smtp.gmail.com"
SUBJECT_EMAIL = "AI Concierge Desk Service Password Reset Confirmation Email (Reset not completed)"

BODY_EMAIL = """
<html>
<head></head>
<body>
    <p>==========================================================================<br>
    This email is sent automatically by the AI ​Concierge Desk Service Office.<br>
    ==========================================================================</p>

    <p>This is the AI ​​Concierge Desk Service Office.<br>
    Please click on the URL below to continue with the password reset procedure.<br>
    <a href="{reset_link}">Please click here</a></p>

    <p>▼Notes regarding the procedure<br>
    <Deadline for processing><br>
    Please complete the password reset procedure within 5 minutes of receiving this email.<br>
    If more time has passed, please start over from the beginning.</p>

    <p>▼If you don't recognize this email<br>
    It seems someone typed your email address incorrectly.<br>
    Please discard this email.</p>

    <p>----------------------------------------------------------------------------<br>
    ※This email is sent from a dedicated sender address. Even if you reply, we will not respond.<br>
    Please note that this is not possible.</p>
</body>
</html>
"""

RESET_LINK_EXP = 24  # 24 hours


# Upload/ embedding file by CMD
EXTENSION_UPLOAD_FILE = [".xls", ".xlsx", ".pdf", ".doc", ".docx", ".txt"]


# Tag for API
AUTH = "Auth"
CHAT = "Chat"
USER = "User"
UPLOAD = "Upload"
DEPARTMENT = 'Department'
FILE = 'File'
FOLDER = 'Folder'
PERMISSION = 'Permission'
ACCESS_CONTROL ='Access Control'
NOTIFICATIONS = 'Notifications'
