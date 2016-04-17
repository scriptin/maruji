Work in progress...

TODO:

- Kanji components question type:
  - How to split kanji into components? Textual representation vs. partial SVG
  - If possible, take position into account, e.g. give answer options for the same component in different places

- Progress:
  - Storage format
  - Handling updates
  - Generating question based on progress data

- Progress page:
  - Reset progress
  - View progress: design appropriate D3 charts
  - Backups via file export: [Data URI scheme](https://en.wikipedia.org/wiki/Data_URI_scheme) + `download` attribute; [File API](https://www.w3.org/TR/FileAPI/); see <http://stackoverflow.com/q/2897619/484666>
  - Backups to Google Drive

- Documentation:
  - Usage instructions page
  - About page

- UI/visual:
  - Display circle or cross symbol on SVG button when it is clicked as an answer to provide additional indication of the result (currently it's only the green or red color)
  - Logo
  - Favicon
  - Slogan in the title
