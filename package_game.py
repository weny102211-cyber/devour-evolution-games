import os
import zipfile

def package():
    zip_filename = 'devour-evolution-games-v1.1.0-monetized.zip'
    if os.path.exists(zip_filename):
        os.remove(zip_filename)

    included_root_files = [
        'index.html',
        'main.js',
        'style.css',
        'game.json',
        'project.config.json',
        'favicon.ico',
        'alipay_qr.png',
        'douyin_app_icon.png',
        'itch_cover_630x500.png'
    ]

    included_dirs = ['libs', 'src']

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as z:
        for fname in included_root_files:
            if os.path.exists(fname):
                z.write(fname, arcname=fname)
                print(f"Added: {fname}")

        for d in included_dirs:
            for root, dirs, files in os.walk(d):
                for f in files:
                    full_path = os.path.join(root, f)
                    arcname = os.path.relpath(full_path, start='.').replace(os.sep, '/')
                    z.write(full_path, arcname=arcname)
                    print(f"Added: {arcname}")

    print(f"\nSuccessfully created {zip_filename} ({os.path.getsize(zip_filename)} bytes)")

if __name__ == '__main__':
    package()
