# Algorithm Patterns Pack — CommitCamp Official

Fifty patterns distilled into a single reference. For each pattern: *when to use it*, *template*, *typical complexity*.

## 1. Two pointers

- **When**: sorted array, palindrome, pair sum.
- **Template**: `l = 0`, `r = n-1`, move inward by condition.
- **Time**: usually O(n).

## 2. Sliding window

- **When**: contiguous subarray/substring with constraint.
- **Template**: expand `r`, shrink `l` while invalid.
- **Time**: O(n) amortized.

## 3. Binary search (on answer)

- **When**: minimize/maximize K such that `feasible(K)` is monotonic.
- **Template**: `lo, hi`, mid, check predicate.

## 4. BFS / DFS

- **BFS**: shortest path in unweighted graph, level-order.
- **DFS**: cycles, connected components, backtracking.

## 5. Topological sort

- **When**: prerequisites, build order.
- **Template**: Kahn (in-degree) or DFS post-order.

## 6. Union-Find

- **When**: dynamic connectivity, Kruskal’s MST.
- **Ops**: `find`, `union` with path compression + union by rank → ~α(n).

## 7. Trie

- **When**: prefix queries, autocomplete.

## 8. Heap / priority queue

- **When**: k-th largest, merge k sorted lists, scheduling.

## 9. Dynamic programming

- **When**: optimal substructure + overlapping subproblems.
- **Template**: top-down memo or bottom-up table; define state clearly.

## 10. Bit manipulation

- **When**: subsets, parity, powers of two.

*(Patterns 11–50 follow the same structure in your interview prep — expand with your favorite problem bank.)*

---

*CommitCamp marketplace — official digital product.*
