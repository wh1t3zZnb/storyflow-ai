import os
import json
import sys
import time
import requests
from pathlib import Path

def main():
    # 优先从环境变量获取,也可以直接在这里修改默认值
    api_key = os.getenv("NANOBANANA_API_KEY", "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").strip()
    
    # 如果没有设置 API Key,提醒用户
    if not api_key:
        print("提示: 未找到环境变量 NANOBANANA_API_KEY")
        print("请设置环境变量,或者直接在脚本中修改 api_key 变量")
        sys.exit(1) 

    # OpenRouter API 地址
    default_url = "https://openrouter.ai/api/v1/chat/completions" 
    url = os.getenv("NANOBANANA_BASE_URL", default_url).strip()
    
    # 默认模型: google/gemini-2.5-flash-image
    model = os.getenv("NANOBANANA_MODEL_ID", "google/gemini-2.5-flash-image").strip()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # 图片生成提示词
    image_prompt = "请生成一张美丽的日落海滩场景,包含椰树和海浪,风格为写实摄影"
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一个图片生成助手。"},
            {"role": "user", "content": f"图片生成提示词: {image_prompt}"}
        ]
    }

    print("-" * 60)
    print(f"正在测试图片生成...")
    print(f"URL: {url}")
    print(f"Model: {model}")
    print(f"提示词: {image_prompt}")
    print("-" * 60)

    try:
        start = time.time()
        resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=60)
        cost = time.time() - start
    except Exception as e:
        print("请求发送失败 (Request Failed):", e)
        sys.exit(2)

    if resp.status_code != 200:
        print(f"HTTP 错误 (Status Code: {resp.status_code})")
        print("返回内容:", resp.text[:500])
        sys.exit(3)

    try:
        data = resp.json()
    except Exception:
        print("JSON 解析失败 (JSON Parse Failed)")
        print("返回内容:", resp.text[:500])
        sys.exit(4)

    # 获取回复内容
    content = ""
    if "choices" in data and len(data["choices"]) > 0:
        content = data["choices"][0].get("message", {}).get("content", "")
    else:
        content = str(data)

    print(f"\n✓ 测试成功 (Success)!")
    print(f"耗时: {round(cost, 2)}s")
    print(f"\n回复内容:\n{content}")
    
    # 保存完整响应到文件
    output_dir = Path(__file__).parent / "out"
    output_dir.mkdir(exist_ok=True)
    
    response_file = output_dir / "response.json"
    with open(response_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n完整响应已保存到: {response_file}")
    
    # 检查是否包含图片URL
    if "http" in content.lower() and (".png" in content.lower() or ".jpg" in content.lower() or ".jpeg" in content.lower() or "image" in content.lower()):
        print("\n提示: 回复中可能包含图片链接,请查看上方内容")
    
    print("-" * 60)

if __name__ == "__main__":
    main()
