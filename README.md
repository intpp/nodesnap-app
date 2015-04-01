# nodesnap-app
NodeJs Monosnap uploader application for Linux, Windows, Mac

# REQUIREMENTS
- NodeJS
- Xclip (for Ubuntu, Linux Mint, Debian)

# INSTALLATION
```bash
    # Go to directory with application.
    cd /path/to/nodesnap-app/
    
    # Install application dependencies.
    npm install
    
    # Configure your directory with images. Application watch changes in this directory.
    vim data/config.json
    
    # Create file for uploaded image list
    touch data/images.json
```

# START
```bash
    nodejs app.js
```

# USAGE
1. Save or copy your image to directory
2. Get your short url for uploaded image

# TODO
[ ] Configure directory with images after first start
[ ] Automatic creation of all needed files
[ ] Checking required directories and files
[ ] Remove file from monosnap
[ ] ...