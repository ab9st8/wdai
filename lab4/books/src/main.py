from fastapi import FastAPI
from .api import protected_router

app = FastAPI()
app.include_router(protected_router)

if __name__ == "__main__":
	import uvicorn

	uvicorn.run("src.main:app", host="0.0.0.0", port=3000, reload=True)

