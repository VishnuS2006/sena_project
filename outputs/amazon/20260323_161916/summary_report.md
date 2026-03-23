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

The fitted log-log tail quantifies how fast connectivity concentration decays. Lower gamma implies a heavier tail; even when gamma is higher, the skewed degree distribution still creates strong hub dominance.

## Fairness Findings
PageRank is the baseline. The strongest long-tail exposure came from Degree-Normalized PageRank, using a long-tail cutoff of degree <= 10, which changed tail visibility by +0.1200. The lowest inequality came from Degree-Normalized PageRank, which changed Gini by +0.0867 relative to PageRank.

## Algorithm Runtime (seconds)
```text
                    algorithm  iterations runtime_seconds
0                    hits_hub         100        2.723095
1              hits_authority         100        2.723095
2                    pagerank          94        1.660581
3       personalized_pagerank          97        1.598840
4  degree_normalized_pagerank         100        1.731965
```

## Fairness Metrics
```text
                           gini_coefficient normalized_entropy tail_visibility_share  tail_visibility_count tail_threshold_degree degree_spearman top_k_mass_share
algorithm                                                                                                                                                         
HITS Authority                     0.996426           0.559627              0.740000                     37             10.000000        0.166471         0.163785
PageRank                           0.313615           0.984403              0.000000                      0             10.000000        0.908196         0.003780
Personalized PageRank              0.291084           0.985405              0.000000                      0             10.000000        0.635675         0.004458
Degree-Normalized PageRank         0.226928           0.993400              0.120000                      6             10.000000        0.058407         0.000897
```

## Rank Correlation
```text
                           HITS Authority  PageRank Personalized PageRank Degree-Normalized PageRank
HITS Authority                   1.000000  0.037009             -0.030517                  -0.126800
PageRank                         0.037009  1.000000              0.870023                   0.234210
Personalized PageRank           -0.030517  0.870023              1.000000                   0.340477
Degree-Normalized PageRank      -0.126800  0.234210              0.340477                   1.000000
```

## Top-K Snapshot
```text
                      algorithm  rank  node_id      degree     score
0                      HITS Hub     1   548091  549.000000  0.018706
1                      HITS Hub     2   436020  197.000000  0.013635
2                      HITS Hub     3   424153  127.000000  0.008831
3                      HITS Hub     4     7308   98.000000  0.008359
4                      HITS Hub     5   410716  108.000000  0.008182
50               HITS Authority     1   548091  549.000000  0.018833
51               HITS Authority     2   436020  197.000000  0.013636
52               HITS Authority     3   424153  127.000000  0.008833
53               HITS Authority     4     7308   98.000000  0.008360
54               HITS Authority     5   410716  108.000000  0.008183
100                    PageRank     1   548091  549.000000  0.000372
101                    PageRank     2   458358  324.000000  0.000146
102                    PageRank     3   222074  257.000000  0.000138
103                    PageRank     4    45146  179.000000  0.000115
104                    PageRank     5   291117  219.000000  0.000109
150       Personalized PageRank     1   548091  549.000000  0.000592
151       Personalized PageRank     2   222074  257.000000  0.000170
152       Personalized PageRank     3    45146  179.000000  0.000168
153       Personalized PageRank     4   458358  324.000000  0.000151
154       Personalized PageRank     5   265965  118.000000  0.000132
200  Degree-Normalized PageRank     1   548091  549.000000  0.000143
201  Degree-Normalized PageRank     2   265965  118.000000  0.000034
202  Degree-Normalized PageRank     3   502906   51.000000  0.000026
203  Degree-Normalized PageRank     4    45146  179.000000  0.000024
204  Degree-Normalized PageRank     5   522786   16.000000  0.000021
```

## Generated Plots
- degree_distribution: E:\SENA\outputs\amazon\20260323_161916\plots\degree_distribution.png
- rank_vs_degree: E:\SENA\outputs\amazon\20260323_161916\plots\rank_vs_degree.png
- top_k_comparison: E:\SENA\outputs\amazon\20260323_161916\plots\top_k_comparison.png
- correlation_heatmap: E:\SENA\outputs\amazon\20260323_161916\plots\correlation_heatmap.png
- fairness_comparison: E:\SENA\outputs\amazon\20260323_161916\plots\fairness_comparison.png

## Interpretation
Traditional PageRank and HITS typically concentrate visibility around high-degree nodes. If the modified variants reduce Gini, increase normalized entropy, and lift tail visibility, they are making the long tail more visible without discarding network structure.
