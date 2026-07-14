# 猫試し / JATA POWER RUSH

`猫騙し`の語感をもじった日本語タイトル「猫試し」。数字を吸収して成長し、猫侍が師範へ挑むスマートフォン向けHTML Canvasゲームです。英語タイトルと公開URLは従来どおりです。

## 公開先

- Game: https://jata-power-rush.vercel.app/
- GitHub: https://github.com/teru2nd-ship-it/jata-power-rush

## 遊び方

- 自分より小さい数字の竹や中ボスを選ぶと、その数字を吸収します。
- 分岐ゲートと倍率アイテムでパワーを伸ばします。
- 自分より小さい師範を倒すと次の修行へ進みます。
- 30の修行を終えると奥義皆伝。達成後は31面から終わりなき修行へ進めます。

タイトル画面では、黒猫の女侍と茶トラの男侍を選択できます。
和風チップチューンBGMと効果音は右上の音声ボタンで切り替えられます。上端の共通メニューからゲーム一覧・全画面表示を利用できます。

## ローカル起動

```sh
python3 -m http.server 8787 --bind 0.0.0.0
```

ブラウザーで `http://localhost:8787/` を開きます。

## 構成

- `index.html`: ゲーム本体
- `assets/arcade-game-menu.js`: JATA ARCADE共通メニュー・音声・共有ボタン
- `assets/og-neko-dameshi.png`: 公開共有・JATA ARCADEカード用1200×630画像
- `assets/backgrounds/`: 道場・日本城背景
- `assets/enemies/`: 竹、忍者、中ボス、ボス
- `assets/heroes/`: 黒猫侍・茶トラ侍

画像素材の元データは各`source/`フォルダに保存しています。
