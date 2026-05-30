"""
CirBet Narration Generator + Video Combiner
1. Microsoft Neural TTS (edge-tts) → narration.mp3
2. FFmpeg: cirbet-demo.webm + narration.mp3 → cirbet-demo-narrated.mp4
"""

import asyncio
import subprocess
import os
import sys

SCRIPT = """What if you could bet on real-world outcomes — instantly, on-chain — using USDC you already hold? Meet CirBet.

CirBet is a prediction market built natively on Arc Network. Browse live questions across crypto, sports, and geopolitics. Every market is on-chain. Every outcome is verifiable. And every bet settles in USDC — the stablecoin you already use.

Placing a bet takes just seconds. Pick your outcome, enter your amount, confirm. No gas fees — Arc Network handles that. Your position is recorded on-chain the moment you hit Place Bet.

Done. You're in the market. When the outcome resolves, winnings land directly in your wallet — no manual claims, no waiting.

The built-in wallet does more than just hold USDC. Send funds to any address in one tap. Bridge between Arc Testnet and seven other chains. Or swap between USDC, EURC, and cirBTC — all inside the same interface, powered by Circle App Kit.

We're also bringing multi-currency betting to prediction markets. USDC is live today. EURC and QCAD — Canada's first regulated CAD stablecoin — are coming next.

The creator dashboard lets you spin up your own market in minutes. A Goldsky-powered subgraph indexes every bet, every resolution, and every claim in real time.

CirBet is live on Arc Testnet right now. No email, no KYC — just connect and bet. Visit cirbet dot xyz."""

BASE    = r"D:\Monster\Desktop\Genel 2026\arc\arc dev\cirbet"
AUDIO   = os.path.join(BASE, "narration.mp3")
VID_IN  = os.path.join(BASE, "cirbet-demo.webm")
VID_OUT = os.path.join(BASE, "cirbet-demo-narrated.mp4")
FFMPEG  = r"D:\Monster\Desktop\Genel 2026\arc\arc dev\cirbet\node_modules\ffmpeg-static\ffmpeg.exe"

async def main():
    import edge_tts

    print("Generating narration - en-US-GuyNeural (Microsoft Neural)...")
    communicate = edge_tts.Communicate(SCRIPT, "en-US-GuyNeural", rate="+5%")
    await communicate.save(AUDIO)
    size = os.path.getsize(AUDIO) / 1024
    print(f"Audio saved: {AUDIO} ({size:.0f} KB)")
    print()

    print("Combining video + audio with FFmpeg...")
    cmd = [
        FFMPEG, "-y",
        "-i", VID_IN,
        "-i", AUDIO,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        VID_OUT
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("FFmpeg stderr:", result.stderr[-2000:])
        sys.exit(1)

    size_mb = os.path.getsize(VID_OUT) / (1024 * 1024)
    print(f"Done! {VID_OUT}")
    print(f"Size: {size_mb:.1f} MB")

asyncio.run(main())
