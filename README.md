# Very easy to run source code

# env

copy file: .env.example to .env change with param to use

# Run docker-compose

run cmd: docker-compose up -d

# Migrate database

run cmd:

Step 1:

docker exec chatbot alembic revision --autogenerate -m "message"

Step 2:

docker exec chatbot alembic upgrade head


# Create account admin

cmd: 
step 1:

docker exec -it chatbot bash 

Step 2:
python -m app.cli create-admin-user username password

exp:

python -m app.cli create-admin-user admin@gmail.com 123456