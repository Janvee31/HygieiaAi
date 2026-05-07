# VS Code Setup

## 1. Install prerequisites

- Install Node.js 18+.
- Install Python 3.10 or 3.11 from [python.org](https://www.python.org/downloads/windows/).
- During Python install, enable `Add python.exe to PATH`.

## 2. Open the project in VS Code

- Open the folder `C:\Users\janve\Desktop\Hackathon\hygiea`.
- Install the VS Code extensions `Python`, `Pylance`, and `ESLint` if prompted.

## 3. Create the Python virtual environment

Run this in the VS Code terminal from the project root:

```powershell
python -m venv .venv
```

If `python` still does not work, try:

```powershell
py -3 -m venv .venv
```

## 4. Activate the virtual environment

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 5. Install dependencies

Backend:

```powershell
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

Frontend:

```powershell
npm install
```

## 6. Add environment variables

Create a file named `.env.local` in the project root and add the values you need, for example:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GEMINI_API_KEY=your_gemini_api_key
```

## 7. Run the app

Backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

Run that command from:

```text
C:\Users\janve\Desktop\Hackathon\hygiea\backend
```

Frontend:

```powershell
npm run dev
```

Run that command from:

```text
C:\Users\janve\Desktop\Hackathon\hygiea
```

## 8. Use the built-in VS Code configs

- `Terminal > Run Task > Run Full Stack` starts frontend and backend.
- `Run and Debug > Full Stack` launches both debuggers.
- `Run and Debug > Backend: FastAPI` launches only the backend.
- `Run and Debug > Frontend: Next.js` launches only the frontend.
