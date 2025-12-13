from fastapi import FastAPI

app = FastAPI()


@app.get("/ping")
async def ping():
	return {"ping": "pong", "from": "users"}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("src.main:app", host="0.0.0.0", port=3000, reload=True)

