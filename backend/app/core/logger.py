import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from app.core.config import settings
import sys

# Create log directory if it doesn't exist
# Use a temporary directory that should be writable
log_dir = "/tmp/chatbot_logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Define the log file with today's date
today = datetime.now().strftime("%Y-%m-%d")
log_file = os.path.join(log_dir, f"backend-{today}.log")

# Configure the logger
logger = logging.getLogger()
logger.setLevel(logging.getLevelName(settings.LOG_LEVEL))

# Clear existing handlers if any
if logger.handlers:
    logger.handlers.clear()

# Create a console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.getLevelName(settings.LOG_LEVEL))
console_formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Create a file handler that rotates every day
file_handler = TimedRotatingFileHandler(
    log_file,
    when="midnight",
    interval=1,
    backupCount=14,  # Keep logs for 14 days
)
file_handler.setLevel(logging.getLevelName(settings.LOG_LEVEL))
file_formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

# Also set up a size-based rotation to prevent very large log files
size_handler = RotatingFileHandler(
    log_file,
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=5
)
size_handler.setLevel(logging.getLevelName(settings.LOG_LEVEL))
size_handler.setFormatter(file_formatter)
logger.addHandler(size_handler)

# Disable propagation to prevent duplicate logs
logger.propagate = False
