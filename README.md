# ZJX Discord Role Bot
Automatically assigns roles based on VATSIM Rating + Facility

> [!WARNING]
> This project is no longer maintained. Please use at your own risk.

# Deploying
You can deploy the bot using Docker (preferred) or pm2.
## Docker
1. Run `docker compose up --build -d`
2. Confirm the bot is up by running `docker ps`
## PM 2
1. Run `pm2 start --name rolesbot --watch`
