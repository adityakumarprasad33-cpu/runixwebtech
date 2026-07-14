from PIL import Image

def remove_white_bg(input_path, output_png, output_ico):
    img = Image.open(input_path).convert('RGBA')
    datas = img.getdata()
    
    newData = []
    # Any pixel that is close to white will become transparent
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Save as PNG
    img.save(output_png, 'PNG')
    
    # Save as ICO (favicon)
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    img.save(output_ico, format='ICO', sizes=icon_sizes)

remove_white_bg(
    r'C:\Users\Lenovo\.gemini\antigravity-ide\brain\5b1e0f3a-52d3-4228-bdfa-6d5026301d2c\media__1783746656143.png',
    r'd:\MYPROFILE\public\logo.png',
    r'd:\MYPROFILE\public\favicon.ico'
)
