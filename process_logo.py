from PIL import Image, ImageChops

def process_image(input_path, output_png, output_ico):
    img = Image.open(input_path).convert('RGBA')
    
    # 1. Create a mask to find the bounding box (everything not white)
    # Convert to RGB to ignore any existing alpha for the bounding box
    rgb_img = img.convert('RGB')
    bg = Image.new('RGB', rgb_img.size, (255, 255, 255))
    diff = ImageChops.difference(rgb_img, bg)
    bbox = diff.getbbox()
    
    if bbox:
        # Add a tiny bit of padding
        padding = 10
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(img.width, bbox[2] + padding)
        bottom = min(img.height, bbox[3] + padding)
        img = img.crop((left, top, right, bottom))
    
    # 2. Better white background removal
    datas = img.getdata()
    newData = []
    
    for item in datas:
        # Calculate how "white" the pixel is
        r, g, b, a = item
        # If it's pure white or very close, make it fully transparent
        if r > 240 and g > 240 and b > 240:
            newData.append((255, 255, 255, 0))
        # If it's somewhat white (anti-aliasing edge), calculate an alpha
        elif r > 200 and g > 200 and b > 200:
            # The closer to 255, the more transparent
            # Average of RGB
            avg = (r + g + b) / 3
            # Map 200->255 to alpha 255->0
            alpha = int(255 - ((avg - 200) / 55) * 255)
            newData.append((r, g, b, alpha))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Save as PNG
    img.save(output_png, 'PNG')
    
    # Save as ICO (favicon)
    # Favicon should be square, so let's make it square
    max_size = max(img.width, img.height)
    square_img = Image.new('RGBA', (max_size, max_size), (255, 255, 255, 0))
    offset = ((max_size - img.width) // 2, (max_size - img.height) // 2)
    square_img.paste(img, offset)
    
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    square_img.save(output_ico, format='ICO', sizes=icon_sizes)

process_image(
    r'C:\Users\Lenovo\.gemini\antigravity-ide\brain\5b1e0f3a-52d3-4228-bdfa-6d5026301d2c\media__1783746656143.png',
    r'd:\MYPROFILE\public\logo.png',
    r'd:\MYPROFILE\public\favicon.ico'
)
