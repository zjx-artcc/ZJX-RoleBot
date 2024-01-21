# ZJX Discord Role Bot
Automatically assigns roles based on VATSIM Rating + Facility

# Installation
1. Clone the repository \
```git clone https://github.com/zjxartcc/rolebot.git```
2. Install dependencies \
```yarn``` or ```npm i```
3. Add your bot token to `.env.example` and rename it to `.env`
- ```mv .env.example .env```
4. Compile the bot \
```yarn build```
5. Run the bot \
```yarn start```

# Deploying
You can deploy the bot using Docker (preferred) or pm2.
## Docker
1. Run `docker compose up --build -d`
2. Confirm the bot is up by running `docker ps`
## PM 2
1. Run `pm2 start --name rolesbot --watch`