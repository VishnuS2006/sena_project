# Fair Ranking in Power-Law Networks using Modified PageRank

## Dataset Summary
- Dataset: Amazon Co-Purchase
- Source: E:\SENA\com-amazon.ungraph.txt
- Directed: False
- Nodes: 334,863
- Edges: 925,872
- Density: 0.000017
- Isolates: 0

## Power-Law Evidence
- Estimated gamma: 4.1543
- Estimated xmin: 84
- KS distance: 0.0309
- Tail sample size: 152

A gamma value between 2 and 3 is consistent with a heavy-tailed network. That matters because standard link-analysis methods tend to reward already well-connected nodes in this regime.

## Fairness Findings
PageRank is the baseline. The strongest long-tail exposure came from Personalized PageRank, which changed tail visibility by +0.0000. The lowest inequality came from Degree-Normalized PageRank, which changed Gini by +0.1095 relative to PageRank.

## Algorithm Runtime (seconds)
```text
                    algorithm  iterations runtime_seconds
0                    hits_hub         100        3.380768
1              hits_authority         100        3.380770
2                    pagerank          94        1.701436
3       personalized_pagerank          97        1.990357
4  degree_normalized_pagerank         100        2.171486
```

## Fairness Metrics
```text
                           gini_coefficient normalized_entropy tail_visibility_share  tail_visibility_count tail_threshold_degree degree_spearman top_k_mass_share
algorithm                                                                                                                                                         
HITS Authority                     0.996426           0.559627              0.000000                      0              3.000000        0.166471         0.087933
PageRank                           0.313615           0.984403              0.000000                      0              3.000000        0.908196         0.001331
Personalized PageRank              0.291084           0.985405              0.000000                      0              3.000000        0.635675         0.001743
Degree-Normalized PageRank         0.204084           0.994553              0.000000                      0              3.000000        0.599331         0.000344
```

## Rank Correlation
```text
                           HITS Authority  PageRank Personalized PageRank Degree-Normalized PageRank
HITS Authority                   1.000000  0.037009             -0.030517                  -0.026072
PageRank                         0.037009  1.000000              0.870023                   0.775877
Personalized PageRank           -0.030517  0.870023              1.000000                   0.798762
Degree-Normalized PageRank      -0.026072  0.775877              0.798762                   1.000000
```

## Top-K Snapshot
```text
                     algorithm  rank  node_id      degree     score
0                     HITS Hub     1   548091  549.000000  0.018706
1                     HITS Hub     2   436020  197.000000  0.013635
2                     HITS Hub     3   424153  127.000000  0.008831
3                     HITS Hub     4     7308   98.000000  0.008359
4                     HITS Hub     5   410716  108.000000  0.008182
10              HITS Authority     1   548091  549.000000  0.018833
11              HITS Authority     2   436020  197.000000  0.013636
12              HITS Authority     3   424153  127.000000  0.008833
13              HITS Authority     4     7308   98.000000  0.008360
14              HITS Authority     5   410716  108.000000  0.008183
20                    PageRank     1   548091  549.000000  0.000372
21                    PageRank     2   458358  324.000000  0.000146
22                    PageRank     3   222074  257.000000  0.000138
23                    PageRank     4    45146  179.000000  0.000115
24                    PageRank     5   291117  219.000000  0.000109
30       Personalized PageRank     1   548091  549.000000  0.000592
31       Personalized PageRank     2   222074  257.000000  0.000170
32       Personalized PageRank     3    45146  179.000000  0.000168
33       Personalized PageRank     4   458358  324.000000  0.000151
34       Personalized PageRank     5   265965  118.000000  0.000132
40  Degree-Normalized PageRank     1   548091  549.000000  0.000127
41  Degree-Normalized PageRank     2   265965  118.000000  0.000035
42  Degree-Normalized PageRank     3    45146  179.000000  0.000030
43  Degree-Normalized PageRank     4   502906   51.000000  0.000028
44  Degree-Normalized PageRank     5   312527   91.000000  0.000021
```

## Generated Plots
- degree_distribution: E:\SENA\outputs\amazon\20260323_153528\plots\degree_distribution.png
- rank_vs_degree: E:\SENA\outputs\amazon\20260323_153528\plots\rank_vs_degree.png
- top_k_comparison: E:\SENA\outputs\amazon\20260323_153528\plots\top_k_comparison.png
- correlation_heatmap: E:\SENA\outputs\amazon\20260323_153528\plots\correlation_heatmap.png
- fairness_comparison: E:\SENA\outputs\amazon\20260323_153528\plots\fairness_comparison.png

## Interpretation
Traditional PageRank and HITS typically concentrate visibility around high-degree nodes. If the modified variants reduce Gini, increase normalized entropy, and lift tail visibility, they are making the long tail more visible without discarding network structure.
