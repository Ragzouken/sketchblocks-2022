call build
call neocities upload -d sketchblocks .\dist\index.html
call neocities upload -d sketchblocks .\dist\tiles.png
call butler push dist candle/sketchblocks:web
