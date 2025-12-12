from fastapi import FastAPI

app = FastAPI()


@app.get("/ping")
async def ping():
	return {"ping": "pong"}


if __name__ == "__main__":
	import uvicorn
	uvicorn.run(app, host="0.0.0.0", port=6969, reload=True)

