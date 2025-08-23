/**
 * Graph Data Structure - Week 7 Day 3-4
 * Utility class for entity relationship mapping
 */

class Graph {
  constructor() {
    this.nodes = new Map()
    this.edges = new Map()
    this.adjacencyList = new Map()
  }

  addNode(id, data = {}) {
    if (this.nodes.has(id)) {
      // Update existing node data
      this.nodes.set(id, { ...this.nodes.get(id), ...data })
    } else {
      this.nodes.set(id, data)
      this.adjacencyList.set(id, new Set())
    }
  }

  addEdge(node1, node2, data = {}) {
    // Ensure both nodes exist
    if (!this.nodes.has(node1)) this.addNode(node1)
    if (!this.nodes.has(node2)) this.addNode(node2)

    const edgeId = `${node1}-${node2}`
    const reverseEdgeId = `${node2}-${node1}`

    // Store edge data
    this.edges.set(edgeId, data)
    
    // Update adjacency list
    this.adjacencyList.get(node1).add(node2)
    this.adjacencyList.get(node2).add(node1)
  }

  getNode(id) {
    return this.nodes.get(id)
  }

  getEdge(node1, node2) {
    const edgeId = `${node1}-${node2}`
    const reverseEdgeId = `${node2}-${node1}`
    return this.edges.get(edgeId) || this.edges.get(reverseEdgeId)
  }

  getNeighbors(nodeId) {
    return Array.from(this.adjacencyList.get(nodeId) || [])
  }

  getAllNodes() {
    return Array.from(this.nodes.keys())
  }

  getAllEdges() {
    return Array.from(this.edges.entries())
  }

  getNodeCount() {
    return this.nodes.size
  }

  getEdgeCount() {
    return this.edges.size
  }

  // Calculate node degree (number of connections)
  getDegree(nodeId) {
    return this.adjacencyList.get(nodeId)?.size || 0
  }

  // Find nodes with highest degree (centrality)
  getCentralNodes(limit = 5) {
    const nodesByDegree = this.getAllNodes()
      .map(nodeId => ({
        id: nodeId,
        degree: this.getDegree(nodeId),
        data: this.getNode(nodeId)
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, limit)

    return nodesByDegree
  }

  // Find connected components (communities)
  findConnectedComponents() {
    const visited = new Set()
    const components = []

    for (const nodeId of this.getAllNodes()) {
      if (!visited.has(nodeId)) {
        const component = []
        this.dfsComponent(nodeId, visited, component)
        if (component.length > 1) {
          components.push(component)
        }
      }
    }

    return components
  }

  dfsComponent(nodeId, visited, component) {
    visited.add(nodeId)
    component.push(nodeId)

    for (const neighbor of this.getNeighbors(nodeId)) {
      if (!visited.has(neighbor)) {
        this.dfsComponent(neighbor, visited, component)
      }
    }
  }

  // Find shortest path between two nodes
  findShortestPath(startNode, endNode) {
    if (!this.nodes.has(startNode) || !this.nodes.has(endNode)) {
      return null
    }

    const queue = [{ node: startNode, path: [startNode] }]
    const visited = new Set([startNode])

    while (queue.length > 0) {
      const { node, path } = queue.shift()

      if (node === endNode) {
        return path
      }

      for (const neighbor of this.getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push({
            node: neighbor,
            path: [...path, neighbor]
          })
        }
      }
    }

    return null
  }

  // Calculate betweenness centrality for pathway analysis
  calculateBetweennessCentrality() {
    const centrality = new Map()
    const nodes = this.getAllNodes()

    // Initialize centrality scores
    nodes.forEach(node => centrality.set(node, 0))

    // Calculate for all pairs of nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const path = this.findShortestPath(nodes[i], nodes[j])
        if (path && path.length > 2) {
          // Increment centrality for intermediate nodes
          for (let k = 1; k < path.length - 1; k++) {
            const current = centrality.get(path[k])
            centrality.set(path[k], current + 1)
          }
        }
      }
    }

    return centrality
  }

  // Export graph structure for analysis
  exportGraphData() {
    return {
      nodes: Array.from(this.nodes.entries()).map(([id, data]) => ({
        id,
        ...data,
        degree: this.getDegree(id)
      })),
      edges: Array.from(this.edges.entries()).map(([id, data]) => {
        const [source, target] = id.split('-')
        return {
          source,
          target,
          ...data
        }
      }),
      metrics: {
        nodeCount: this.getNodeCount(),
        edgeCount: this.getEdgeCount(),
        density: (2 * this.getEdgeCount()) / (this.getNodeCount() * (this.getNodeCount() - 1))
      }
    }
  }
}

export default Graph