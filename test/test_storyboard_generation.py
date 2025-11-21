import os
import json
import sys
import time
import requests
import base64
from pathlib import Path

# API 配置
API_KEY = os.getenv("NANOBANANA_API_KEY", "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")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.5-flash-image"

def save_base64_image(base64_data, filename):
    """保存 base64 图片到文件"""
    output_dir = Path("test/out")
    output_dir.mkdir(exist_ok=True)
    
    # 移除 data:image/png;base64, 前缀
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    
    image_data = base64.b64decode(base64_data)
    filepath = output_dir / filename
    filepath.write_bytes(image_data)
    print(f"✓ 图片已保存: {filepath}")
    return str(filepath)

def generate_image(prompt, step_name):
    """调用 API 生成图片"""
    print(f"\n{'='*60}")
    print(f"步骤: {step_name}")
    print(f"{'='*60}")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "你是专业的图片生成助手。"},
            {"role": "user", "content": prompt}
        ]
    }
    
    print(f"提示词: {prompt[:200]}...")
    print("正在生成...")
    
    start = time.time()
    response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
    elapsed = time.time() - start
    
    if response.status_code != 200:
        print(f"❌ 错误: {response.status_code}")
        print(response.text[:500])
        return None
    
    data = response.json()
    print(f"✓ 耗时: {elapsed:.2f}秒")
    
    return data

def step1_generate_references():
    """步骤1: 生成参考图"""
    print("\n" + "="*60)
    print("第一步: 生成参考图(女人和橘猫)")
    print("="*60)
    
    # 生成女人参考图
    woman_prompt = "一位年轻的亚洲女性,长发,温柔的笑容,现代休闲装,写实摄影风格,高质量,细节丰富"
    woman_data = generate_image(woman_prompt, "生成女人参考图")
    
    if not woman_data:
        return None, None
    
    # 提取女人图片
    woman_images = woman_data.get('choices', [{}])[0].get('message', {}).get('images', [])
    if not woman_images:
        print("❌ 未找到女人图片")
        return None, None
    
    woman_image_url = woman_images[0]['image_url']['url']
    woman_path = save_base64_image(woman_image_url, "reference_woman.png")
    
    # 等待一下避免频率限制
    time.sleep(2)
    
    # 生成橘猫参考图
    cat_prompt = "一只可爱的橘色猫咪,毛茸茸的,圆润的身材,温柔的表情,写实摄影风格,高质量,细节丰富"
    cat_data = generate_image(cat_prompt, "生成橘猫参考图")
    
    if not cat_data:
        return woman_image_url, None
    
    # 提取猫图片
    cat_images = cat_data.get('choices', [{}])[0].get('message', {}).get('images', [])
    if not cat_images:
        print("❌ 未找到猫图片")
        return woman_image_url, None
    
    cat_image_url = cat_images[0]['image_url']['url']
    cat_path = save_base64_image(cat_image_url, "reference_cat.png")
    
    return woman_image_url, cat_image_url

def step2_generate_storyboards(woman_image, cat_image):
    """步骤2: 批量生成分镜"""
    print("\n" + "="*60)
    print("第二步: 批量生成3个分镜场景")
    print("="*60)
    
    # 构建完整的提示词
    prompt = f"""你是专业的分镜画师。请根据以下设定生成3张连续的分镜图片。

【人物设定】
1. 女主角: 参考下方第一张图片的女性,保持外貌一致
2. 橘猫: 参考下方第二张图片的橘猫,保持外貌一致

【整体风格】
- 写实摄影风格
- 画面比例: 16:9
- 夜晚氛围,昏暗的灯光

【分镜列表】
第1镜 [场景:走廊,人物:橘猫]
午夜过后,走廊的灯光昏暗,橘猫色的月亮,勾勒出每扇门门框边缘。女主人的房门缝里过去一团影子,她以为是邻居家的猫。

第2镜 [场景:门口,人物:女主人]
女主人把耳朵贴在门上,楼下垃圾道里传来轻微的玻璃碰撞声,像某种小动物把自己关进了瓶子。

第3镜 [场景:电梯,人物:女主人+橘猫]
女主人忽然想到傍晚看见的那只橘猫,它在电梯里呆着,眼神里像在等一个还到的人。
"""

    # 构建消息,包含参考图
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system", 
                "content": "你是专业的分镜画师,擅长创作连贯的视觉故事。"
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": woman_image}},
                    {"type": "image_url", "image_url": {"url": cat_image}}
                ]
            }
        ]
    }
    
    print("提示词构建完成,包含:")
    print("- 3个分镜详细描述")
    print("- 女人参考图")
    print("- 橘猫参考图")
    print("\n正在生成分镜序列...")
    
    start = time.time()
    response = requests.post(API_URL, headers=headers, json=payload, timeout=180)
    elapsed = time.time() - start
    
    if response.status_code != 200:
        print(f"❌ 错误: {response.status_code}")
        print(response.text[:500])
        return None
    
    data = response.json()
    print(f"✓ 总耗时: {elapsed:.2f}秒")
    
    # 保存完整响应
    output_dir = Path("test/out")
    with open(output_dir / "storyboard_response.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ 完整响应已保存: test/out/storyboard_response.json")
    
    return data

def extract_storyboard_images(data):
    """提取并保存分镜图片"""
    print("\n" + "="*60)
    print("第三步: 提取分镜图片")
    print("="*60)
    
    # 获取返回的图片
    message = data.get('choices', [{}])[0].get('message', {})
    images = message.get('images', [])
    
    print(f"找到 {len(images)} 张图片")
    
    saved_images = []
    for i, img in enumerate(images, 1):
        image_url = img['image_url']['url']
        filename = f"storyboard_{i}.png"
        path = save_base64_image(image_url, filename)
        saved_images.append(path)
    
    return saved_images

def main():
    print("\n" + "🎬"*30)
    print("分镜批量生成测试")
    print("🎬"*30)
    
    try:
        # 直接读取已有的参考图
        print("\n正在加载已有的参考图...")
        woman_image_path = Path("test/out/reference_woman.png")
        cat_image_path = Path("test/out/reference_cat.png")
        
        if not woman_image_path.exists() or not cat_image_path.exists():
            print("❌ 参考图不存在,请先运行一次生成参考图")
            sys.exit(1)
        
        # 读取并转换为base64
        woman_image_data = woman_image_path.read_bytes()
        woman_base64 = base64.b64encode(woman_image_data).decode('utf-8')
        woman_image = f"data:image/png;base64,{woman_base64}"
        
        cat_image_data = cat_image_path.read_bytes()
        cat_base64 = base64.b64encode(cat_image_data).decode('utf-8')
        cat_image = f"data:image/png;base64,{cat_base64}"
        
        print("✓ 参考图加载完成!")
        
        # 步骤2: 批量生成分镜
        storyboard_data = step2_generate_storyboards(woman_image, cat_image)
        
        if not storyboard_data:
            print("\n❌ 分镜生成失败")
            sys.exit(1)
        
        # 步骤3: 提取图片
        saved_images = extract_storyboard_images(storyboard_data)
        
        # 最终总结
        print("\n" + "="*60)
        print("✅ 测试完成!")
        print("="*60)
        print(f"\n生成的文件:")
        print("参考图:")
        print("  - test/out/reference_woman.png")
        print("  - test/out/reference_cat.png")
        print("\n分镜图:")
        for i, path in enumerate(saved_images, 1):
            print(f"  - {path}")
        print("\n响应数据:")
        print("  - test/out/storyboard_response.json")
        
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
