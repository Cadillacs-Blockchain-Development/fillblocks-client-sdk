import { Request, Response } from "express";
import { arweaveSetup } from "../../arwaves/arwaves";


function toBase64(str: string) {
  return Buffer.from(str).toString("base64");
}

function fromBase64(str: string) {
  return Buffer.from(str, "base64").toString("utf-8");
}

export const getUniqueSchemas = async (req: Request, res: Response): Promise<any> => {
  try {
    const orgClientId = (req as any)?.user?.organization?._id.toString();
    if (!orgClientId) {
      return res.status(400).json({ message: "Organization ID not found" });
    }
    console.log(orgClientId)

    const { arweave }: any = await arweaveSetup();

    const pageSize = parseInt(req.query.pageSize as string) || 50;
    let after: string | null = (req.query.after as string) || null;
    const schemaSet: Set<string> = new Set();
    let hasNextPage = true;

    while (hasNextPage) {
      const query = {
        query: `
          query {
            transactions(
              tags: [
                { name: "App-Name", values: ["Philblocks-sdk"] },
                { name: "OrganizationId", values: ["${orgClientId}"] }
              ]
              first: ${pageSize}
              ${after ? `after: "${after}"` : ""}
            ) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  tags {
                    name
                    value
                  }
                }
              }
            }
          }
        `,
      };

      const result = await arweave.api.post("/graphql", query);
      console.log(result,"result")
      const transactions = result?.data?.data?.transactions;
      console.log(transactions,"transactions")


      if (!transactions || !transactions.edges) break;

      const edges = transactions.edges;
      const pageInfo = transactions.pageInfo || { hasNextPage: false };

      for (let edge of edges) {
        const tx = edge.node;
        if (tx.tags) {
          for (let tag of tx.tags) {
            // Check both base64 encoded and plain text versions
            if ((tag.name === toBase64("Schema") || tag.name === "Schema") && tag.value) {
              const schemaValue = tag.name === toBase64("Schema") ? fromBase64(tag.value) : tag.value;
              schemaSet.add(schemaValue);
            }
          }
        }
      }

      hasNextPage = pageInfo.hasNextPage;
      // Note: Arweave GraphQL doesn't support endCursor, so we'll use a different pagination approach
      after = null; // For now, we'll fetch all data without pagination
    }

    return res.status(200).json({
      success: true,
      uniqueSchemas: Array.from(schemaSet),
      count: schemaSet.size,
    });
  } catch (err: any) {
    console.error("❌ Error in getUniqueSchemas:", err.message || err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getDataBySchema = async (req: Request, res: Response): Promise<any> => {
  try {
    const schema = req.params.schema;
    if (!schema) return res.status(400).json({ message: "Schema is required" });

    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const after = (req.query.after as string) || null;
    const orgClientId = (req as any)?.user?.organization?._id;

    if (!orgClientId) {
      return res.status(400).json({ message: "Organization ID not found" });
    }

    const { arweave }: any = await arweaveSetup();

    const query = {
      query: `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["Philblocks-sdk"] },
              { name: "Schema", values: ["${schema}"] },
              { name: "OrganizationId", values: ["${orgClientId}"] }
            ]
            first: ${pageSize}
            ${after ? `after: "${after}"` : ""}
          ) {
            pageInfo {
              hasNextPage
            }
            edges {
              node {
                id
                tags {
                  name
                  value
                }
              }
            }
          }
        }
      `,
    };

    const result = await arweave.api.post("/graphql", query);
    console.log("GraphQL result for getDataBySchema:", JSON.stringify(result?.data, null, 2));
    const transactions = result?.data?.data?.transactions;

    if (!transactions) {
      console.warn("⚠️ No transactions found for schema:", schema, "Result:", result?.data);
      return res.status(404).json({
        success: false,
        message: "No transactions found for this schema",
        rawResponse: result?.data,
      });
    }

    const edges = transactions.edges || [];
    const pageInfo = transactions.pageInfo || { hasNextPage: false };

    const dataList = await Promise.all(
      edges.map(async (edge: any) => {
        const tx = edge.node;
        try {
          const raw = await arweave.transactions.getData(tx.id, { decode: true, string: true });
          return {
            id: tx.id,
            tags: tx.tags,
            data: JSON.parse(raw),
          };
        } catch (e) {
          console.warn(`⚠️ Failed to fetch or parse data for txId: ${tx.id}`);
          return null;
        }
      })
    );

    const filteredData = dataList.filter(Boolean);

    return res.status(200).json({
      success: true,
      schema,
      count: filteredData.length,
      nextCursor: null, // Arweave GraphQL doesn't support endCursor
      data: filteredData,
    });
  } catch (err: any) {
    console.error("❌ Error in getDataBySchema:", err.message || err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

 
export const getSingleUserHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const schema = req.params.schema;
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "User ID is required" });

    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const after = (req.query.after as string) || null;
    const orgClientId = (req as any)?.user?.organization?._id;

    if (!orgClientId) {
      return res.status(400).json({ message: "Organization ID not found" });
    }

    const { arweave }: any = await arweaveSetup();

    const query = {
      query: `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["Philblocks-sdk"] },
              { name: "Schema", values: ["${schema}"] },
              { name: "OrganizationId", values: ["${orgClientId}"] }
            ]
            first: ${pageSize}
            ${after ? `after: "${after}"` : ""}
          ) {
            pageInfo {
              hasNextPage
            }
            edges {
              node {
                id
                tags {
                  name
                  value
                }
              }
            }
          }
        }
      `,
    };

    const result = await arweave.api.post("/graphql", query);
    console.log("GraphQL result for getSingleUserHistory:", JSON.stringify(result?.data, null, 2));
    const transactions = result?.data?.data?.transactions;

    if (!transactions || !transactions.edges) {
      console.warn("⚠️ No transactions found for schema or user:", schema, userId, "Result:", result?.data);
      return res.status(404).json({
        success: false,
        message: "No transactions found for this user",
        rawResponse: result?.data,
      });
    }

    const edges = transactions.edges;
    const pageInfo = transactions.pageInfo || { hasNextPage: false };

    const userTxs = await Promise.all(
      edges.map(async (edge: any) => {
        const tx = edge.node;
        try {
          const raw = await arweave.transactions.getData(tx.id, { decode: true, string: true });
          const data = JSON.parse(raw);
          // Check multiple possible user ID fields
          if (data._id === userId || data.id === userId || data.userId === userId || data.user_id === userId) {
            return {
              txId: tx.id,
              data,
              timestamp: tx.tags.find((t: any) => t.name === "Timestamp")?.value || null,
            };
          }
          return null;
        } catch (e) {
          console.warn(`⚠️ Failed to fetch or parse data for transaction ${tx.id}`);
          return null;
        }
      })
    );

    const filteredTxs = userTxs.filter(Boolean);

    return res.status(200).json({
      success: true,
      schema,
      userId,
      nextCursor: null, // Arweave GraphQL doesn't support endCursor
      history: filteredTxs.sort((a, b) => {
        if (a.timestamp && b.timestamp) return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return 0;
      }),
    });
  } catch (err: any) {
    console.error("❌ Error in getSingleUserHistory:", err.message || err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};


 
export const getTransactionByHash = async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({ message: "Transaction hash is required" });
    }

    const { arweave }: any = await arweaveSetup();

    const txData = await arweave.transactions.getData(txHash, { decode: true, string: true });

    const tx = await arweave.transactions.get(txHash);
    const tags: Record<string, string> = {};
    tx.get("tags").forEach((tag: any) => {
      tags[tag.get("name", { decode: true, string: true })] =
        tag.get("value", { decode: true, string: true });
    });

    res.status(200).json({
      success: true,
      txHash,
      tags,
      data: txData,
    });
  } catch (err: any) {
    console.error("❌ Error fetching Arweave tx:", err.message || err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
      error: err.message,
    });
  }
};
