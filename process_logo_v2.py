from PIL import Image, ImageChops

def process_image(input_path, output_png):
    img = Image.open(input_path).convert('RGBA')
    
    # Threshold the image to find the true bounding box
    # Convert to grayscale, then threshold. White background becomes white, everything else becomes black.
    gray = img.convert('L')
    
    # Invert so background is black, content is white
    def map_pixel(p):
        return 0 if p > 240 else 255
        
    mask = gray.point(map_pixel)
    bbox = mask.getbbox()
    
    if bbox:
        # Add a tiny bit of padding
        padding = 5
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(img.width, bbox[2] + padding)
        bottom = min(img.height, bbox[3] + padding)
        img = img.crop((left, top, right, bottom))
    
    # 2. Better white background removal
    # We will use a standard chroma key style removal for white
    datas = img.getdata()
    newData = []
    
    for item in datas:
        r, g, b, a = item
        # Calculate luminance
        lum = (r + g + b) / 3.0
        if lum > 240:
            # Pure white -> transparent
            newData.append((255, 255, 255, 0))
        elif lum > 150:
            # Anti-aliased edges: Calculate alpha based on luminance (150 -> 240)
            alpha = int(255 - ((lum - 150) / 90.0) * 255)
            # Retain original color, just reduce alpha
            newData.append((r, g, b, min(a, alpha)))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Save as PNG
    img.save(output_png, 'PNG')

process_image(
    r'C:\Users\Lenovo\.gemini\antigravity-ide\brain\5b1e0f3a-52d3-4228-bdfa-6d5026301d2c\media__1783746656143.png',
    r'd:\MYPROFILE\public\logo-v2.png'
)
