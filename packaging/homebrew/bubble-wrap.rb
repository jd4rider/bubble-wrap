cask "bubble-wrap" do
  version "0.2.0"
  name "Bubble Wrap"
  desc "Satisfying bubble wrap popping game"
  homepage "https://bubblewrapgame.online/"

  on_intel do
    sha256 "6362880d2438f7b6ece50a99fd35447e434e5dcc17ebc2f0aeadd55830419be4"
    url "https://github.com/jd4rider/bubble-wrap/releases/download/v#{version}/Bubble-Wrap-mac-x64.dmg"
  end

  on_arm do
    sha256 "2ed165d98acb6a10628ca2c0c2a8f7d485746b464ce5e59a4312c6ecb3048d4d"
    url "https://github.com/jd4rider/bubble-wrap/releases/download/v#{version}/Bubble-Wrap-mac-arm64.dmg"
  end

  depends_on macos: :big_sur

  app "Bubble Wrap.app"

  zap trash: [
    "~/Library/Application Support/Bubble Wrap",
    "~/Library/Application Support/bubble-wrap",
    "~/Library/Caches/bubble-wrap",
    "~/Library/Caches/com.bubblewrap.app",
    "~/Library/Preferences/com.bubblewrap.app.plist",
  ]
end
