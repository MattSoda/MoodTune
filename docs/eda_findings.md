# Exploratory Data Analysis — Phase 3

## Scope

EDA used the 89,740-row, track-level `spotify_cleaned.csv` dataset. It describes
observed associations; it does not establish causation or true human emotional
responses to music.

## Feature distributions

| Feature | Median | Mean | Key observation | Implication |
| --- | ---: | ---: | --- | --- |
| Valence | 0.457 | 0.469 | Broad 0–0.995 range | Primary positivity signal for mood methodology |
| Energy | 0.676 | 0.634 | Catalogue leans toward higher energy, with a low-energy tail | Primary intensity signal |
| Danceability | 0.576 | 0.562 | Broad distribution | Helpful for upbeat/energetic distinctions |
| Acousticness | 0.188 | 0.328 | Strongly right-skewed; many low values | Useful supporting calm/relaxed signal |
| Instrumentalness | 0.000 | 0.173 | At least half of tracks are zero | Useful only as a secondary contextual feature |
| Speechiness | 0.049 | 0.087 | Strongly right-skewed | Secondary signal, not a mood determinant |
| Loudness | -7.185 dB | -8.499 dB | Long low-loudness tail and a few positive values | Supports intensity analysis; retain unusual recordings |
| Tempo | 122.013 BPM | 122.058 BPM | Centre near 122 BPM, with zero and high-tempo values | Supporting intensity/rhythm feature only |
| Popularity | 33 | 33.208 | Broad 0–100 range; 9,347 tracks are zero | Ranking feature, not a mood-label input |
| Liveness | 0.132 | 0.217 | Right-skewed | Low-priority contextual signal |

Histograms and box plots in `03_eda.ipynb` show that long tracks, unusual tempos,
and low loudness values are legitimate catalogue characteristics rather than a
basis for automatic removal.

## Relationships relevant to mood classification

| Relationship | Pearson r | Interpretation |
| --- | ---: | --- |
| Energy vs loudness | 0.759 | Strong positive association; do not treat them as wholly independent evidence |
| Energy vs acousticness | -0.733 | Strong inverse association; acousticness can support low-energy interpretations |
| Valence vs danceability | 0.493 | Moderate positive association; useful for cheerful/upbeat profiles |
| Valence vs energy | 0.256 | Weak-to-moderate association; intensity is not the same as positivity |
| Energy vs tempo | 0.259 | Weak-to-moderate association; tempo must not determine mood alone |
| Danceability vs tempo | -0.021 | Essentially no linear association |
| Valence vs popularity | -0.012 | No meaningful linear association |
| Energy vs popularity | 0.014 | No meaningful linear association |

The correlation heatmap and scatter plots therefore support valence and energy
as core dimensions, with danceability, acousticness, loudness, and tempo used
as supporting evidence. Correlated features must be handled carefully in
rule-based labels and later models.

## Genre findings

There are 114 retained genre labels. After track-level de-duplication, genre
counts range from 904 to 1,000 because multi-genre tracks are retained once but
can be represented under each associated label for descriptive analysis.

Genre means show meaningful contrasts: salsa has the highest mean valence
(0.815), while sleep has the lowest (0.058). Death-metal has the highest mean
energy (0.931), while classical has the lowest (0.195). Kids music has the
highest mean danceability (0.779), whereas sleep is lowest (0.168).

Popularity also varies substantially by genre: pop-film averages 59.280, while
iranian averages 2.225. This reinforces using popularity as a modest
recommendation-ranking signal, not as evidence of musical mood or quality.

## Phase 4 implications

Candidate mood-label methodology should begin with valence and energy, then use
danceability, acousticness, loudness, tempo, and instrumentalness for carefully
justified refinements. Genre must not serve as a direct mood label: genre-level
means overlap and a genre describes style, not a listener’s emotional response.
