; --
(let *INPUT* [ 1 2 3 4 5 ])
; --
(std:vector:map *INPUT* (lambda x (* x x)))
