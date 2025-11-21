import os
import json
import sys
import time
import requests

def main():
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        print("请先设置环境变量 OPENROUTER_API_KEY")
        sys.exit(1)

    url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions").strip()
    model = os.getenv("OPENROUTER_MODEL_ID", "google/gemini-2.5-flash").strip()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一个分镜助手，只返回简短的确认信息。"},
            {"role": "user", "content": "测试连通性，请返回：OK + 当前模型名"}
        ]
    }

    try:
        start = time.time()
        resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
        cost = time.time() - start
    except Exception as e:
        print("请求失败:", e)
        sys.exit(2)

    if resp.status_code != 200:
        print("HTTP错误:", resp.status_code, resp.text[:300])
        sys.exit(3)

    try:
        data = resp.json()
    except Exception:
        print("解析JSON失败", resp.text[:300])
        sys.exit(4)

    content = (
        data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
    )
    print("模型:", model)
    print("耗时(s):", round(cost, 2))
    print("返回:", content)

if __name__ == "__main__":
    main()