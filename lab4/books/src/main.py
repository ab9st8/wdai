from fastapi import FastAPI

app = FastAPI()


@app.get("/ping")
async def ping():
	return {"ping": "pong", "from": "books"}


if __name__ == "__main__":
	import os
	import uvicorn

	port = int(os.environ.get("PORT", "2137"))
	uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)

