import os

import httpx

SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8089")


class SpringClient:

    def send_prospects(self, data: list[dict]):
        response = httpx.post(
            f"{SPRING_URL}/prospects/save",
            json=data,
            timeout=30,
        )
        if response.status_code >= 400:
            print("Spring error status:", response.status_code)
            print("Spring error body:", response.text)
        response.raise_for_status()
        return response.json()
