Unpack the archive before running the data building scripts.

Files:

- `jmdict-eng.json` - modified version of JMdict ([JMdict simplified](https://github.com/scriptin/jmdict-simplified)), created by Jim Breen and managed by the Electronic Dictionary Research and Development Group (EDRDG)
- `kanjidic2.xml` - KANJIDIC2 (with removed `DOCTYPE`) from Jim Breen/EDRDG, a database of kanji that includes readings  and other kanji metadata
- `kradfile.json` - KRADFILE (converted to JSON) from Jim Breen/EDRDG, a database of kanji decomposed into components
- `wikipedia-20150422-lemmas.tsv` - frequency list of Japanese lemmas build from Wikipedia dump files, see <https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Japanese2015_10000>
- `kanji-list.json` - an ordered list of kanji from [TopoKanji](https://github.com/scriptin/topokanji) project (aozora version), with radicals removed
- `similar-kanji.json` - ad-hoc list of similar pairs of kanji, together with similarity coefficients (integers from 1 to 9, with 9 considered the highest similarity)
