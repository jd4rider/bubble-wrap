cask "bubble-wrap" do
  version "0.1.0"
  name "Bubble Wrap"
  desc "Satisfying bubble wrap popping game"
  homepage "https://bubblewrapgame.online/"

  on_intel do
    sha256 "60fb424fdd4e525db524b3a9a5efc3b99c6421ea87dff4bc8408bbab97a1b5ab"
    url "https://github.com/jd4rider/bubble-wrap/releases/download/v#{version}/Bubble-Wrap-mac-x64.dmg"
  end

  on_arm do
    sha256 "f26c1aa32ed8db4c0d7b74a54016853ea8f979c0927aac9a1e710aa8c6ba349c"
    url "https://github.com/jd4rider/bubble-wrap/releases/download/v#{version}/Bubble-Wrap-mac-arm64.dmg"
  end

  depends_on macos: :big_sur

  app "Bubble Wrap.app"

  zap trash: [
    "~/Library/Application Support/Bubble Wrap",
    "~/Library/Caches/com.bubblewrap.app",
    "~/Library/Preferences/com.bubblewrap.app.plist",
  ]
end
