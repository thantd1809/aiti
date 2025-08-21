"""Routes module initialization"""

from app.api.routes.auth import auth_route
from app.api.routes.user import user_route
from app.api.routes.chat import chat_route
from app.api.routes.upload import upload_route
from app.api.routes.department import department_route
from app.api.routes.folder import folder_route
# from app.api.routes.permission import permission_route
from app.api.routes.access_control import access_control_route
from app.api.routes.notifications import noti_route

# List of all routers to be included in the application
routers = [
    auth_route,
    user_route,
    chat_route,
    upload_route,
    department_route,
    folder_route,
    access_control_route,
    noti_route
]
