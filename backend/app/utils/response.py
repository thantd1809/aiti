"""
Utility for the response of the API.
"""
import json

from fastapi import Response

class OutputResponse:
    @staticmethod
    def success(code="", msg="", item=None, data=None):
        """
        Return the OK response of the API.
        """
        response = {
            "result": {
                "status": "OK",
                "code": code,
                "item": item if item is not None else [],
                "msg": msg
            }
        }
        if data is not None:
            response["data"] = data
        return response

    @staticmethod
    def error(code="", msg="", item=None, status_code=400):
        """
        Return the NG response of the API.
        """

        response = {
            "result": {
                "status": "NG",
                "code": code,
                "item": item if item is not None else [],
                "msg": msg
            }
        }
        return Response(content=json.dumps(response), status_code=status_code, media_type="application/json")


    @staticmethod
    def success_with_pagination(code="", msg="", item=None, data=None, page: int = None, limit: int = None, total: int = None):
        """
        Return the OK response of the API with pagination.
        """
        response = {
            "result": {
                "status": "OK",
                "code": code,
                "item": item if item is not None else [],
                "msg": msg
            }
        }
        if data is not None:
            response["data"] = data
        if page is not None:
            response["page"] = page
        if limit is not None:
            response["limit"] = limit
        if total is not None:
            response["total"] = total
        return response