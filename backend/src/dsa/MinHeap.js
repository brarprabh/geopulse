/**
 * Custom Min-Heap Data Structure for Fast O(1) Best-Agent Extraction.
 */
class MinHeap {
    constructor() {
        this.heap = [];
    }

    // Helper getters for tree navigation
    getParentIndex(i) { return Math.floor((i - 1) / 2); }
    getLeftChildIndex(i) { return 2 * i + 1; }
    getRightChildIndex(i) { return 2 * i + 2; }

    swap(index1, index2) {
        [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
    }

    // Insert a new candidate object { agentId, costScore, ... } into the heap
    insert(node) {
        this.heap.push(node);
        this.heapifyUp();
    }

    heapifyUp() {
        let index = this.heap.length - 1;
        while (
            this.getParentIndex(index) >= 0 &&
            this.heap[this.getParentIndex(index)].costScore > this.heap[index].costScore
        ) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }

    // Extract and remove the best candidate (the one with the lowest costScore) in O(log N) time,
    // providing O(1) lookup to the top element.
    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown();
        return min;
    }

    heapifyDown() {
        let index = 0;
        while (this.getLeftChildIndex(index) < this.heap.length) {
            let smallerChildIndex = this.getLeftChildIndex(index);
            const rightChildIndex = this.getRightChildIndex(index);

            if (
                rightChildIndex < this.heap.length &&
                this.heap[rightChildIndex].costScore < this.heap[smallerChildIndex].costScore
            ) {
                smallerChildIndex = rightChildIndex;
            }

            if (this.heap[index].costScore < this.heap[smallerChildIndex].costScore) {
                break;
            }

            this.swap(index, smallerChildIndex);
            index = smallerChildIndex;
        }
    }

    size() {
        return this.heap.length;
    }
}

function rankAgentsWithHeap(candidates) {
    const minHeap = new MinHeap();
    candidates.forEach((c) => minHeap.insert(c));

    const ranked = [];
    while (minHeap.size() > 0) {
        ranked.push(minHeap.extractMin());
    }
    return ranked; // Returns sorted list from best score to worst score
}

module.exports = { MinHeap, rankAgentsWithHeap };