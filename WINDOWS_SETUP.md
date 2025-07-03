# Windows Setup Guide

## Quick Start (One-Click)

1. **Extract the ZIP file** to your desired location (e.g., `C:\pseudocode-converter`)
2. **Double-click `start.bat`** - This will automatically:
   - Check if Node.js is installed
   - Install dependencies if needed
   - Start the application
3. **Open your browser** to `http://localhost:5000`

## Prerequisites

### Node.js Installation
If the batch file says Node.js is not installed:

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (recommended for most users)
3. Run the installer and follow the default options
4. Restart your command prompt/terminal
5. Try running `start.bat` again

## Manual Setup (Alternative)

If you prefer manual setup:

1. Open **Command Prompt** or **PowerShell**
2. Navigate to the project folder:
   ```cmd
   cd C:\path\to\pseudocode-converter
   ```
3. Install dependencies:
   ```cmd
   npm install
   ```
4. Start the application:
   ```cmd
   npm run dev
   ```

## Using the Application

1. Write pseudocode in the editor using this format:
   ```
   When Button1.Click
       Set Screen1.BackgroundColor to Red
       Set Label1.Text to Hello World
   ```

2. Click **"Generate AIA"** to create the MIT App Inventor file

3. Download the AIA file and import it into MIT App Inventor 2

## Troubleshooting

### "Node.js is not installed"
- Install Node.js from nodejs.org
- Make sure to restart your command prompt after installation

### "npm install" fails
- Try running as Administrator
- Check your internet connection
- Clear npm cache: `npm cache clean --force`

### Port 5000 already in use
- Close other applications using port 5000
- Or modify the port in `server/index.ts`

### Browser won't open automatically
- Manually open `http://localhost:5000` in your browser

## MIT App Inventor 2 Integration

1. Go to [ai2.appinventor.mit.edu](https://ai2.appinventor.mit.edu)
2. Sign in with your Google account
3. Click **"Projects"** → **"Import project (.aia) from my computer"**
4. Select the downloaded AIA file
5. Your app components and blocks will be created automatically!

## Support

If you encounter any issues:
- Make sure Node.js version is 18 or higher: `node --version`
- Check that you're in the correct directory when running commands
- Ensure you have internet connection for dependency installation