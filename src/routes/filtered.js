import { Router } from "express";

const router = Router();

import models from "../models";
import RPCRequestTranslator from "../translator";

const acidData = "0x61636964636861696E70617269733233";

function filterByInput(tx) {
  if (tx?.input && tx.input.includes(acidData)) {
    return tx;
  }
  return null;
}

router.post("/", async (request, response) => {
  console.log(request.body);
  var accountId = request.headers["x-quicknode-id"];
  var endpointId = request.headers["x-instance-id"];
  // var rpcMethod = request.body.method;
  var rpcParams = request.body.params;
  console.log("RPC call for:");
  console.log("  accountId: " + accountId);
  console.log("  endpointId: " + endpointId);
  // console.log("  method: " + rpcMethod);
  console.log("  params: " + rpcParams);
  const resultList = [];

  const account = await models.Account.findOne({
    where: {
      quicknode_id: accountId,
    },
  });
  if (account === null) {
    console.log("Could not find account with id: " + accountId);
    response.status(404).json({
      id: 1,
      error: {
        code: -32001,
        message: "Could not find account with id: " + accountId,
      },
      jsonrpc: "2.0",
    });
  } else {
    console.log("Finding endpoint with id: " + endpointId);
    const endpoint = await models.Endpoint.findOne({
      where: {
        quicknode_id: endpointId,
        account_id: account.get("id"),
      },
    });

    if (endpoint === null) {
      console.log("Could not find endpoint with id: " + endpointId);
      response.status(404).json({
        id: 1,
        error: {
          code: -32001,
          message: "Could not find endpoint with id: " + endpointId,
        },
        jsonrpc: "2.0",
      });
    } else {
      // If you need to make a request to the QuickNode endpoint here,
      // then you can use endpoint.get('http_url') to get the URL of the endpoint.
      const newTranslator = new RPCRequestTranslator();
      const translatedRequestResponse = await newTranslator.translateRequest(
        "parity_pendingTransactions",
        { params: [{ gas: "0x46537" }] }
      );

      const txList = await translatedRequestResponse.result;

      txList.forEach((tx) => {
        resultList.push(filterByInput(tx));
      });

      response.status(200).json({
        id: 1,
        result: resultList,
        jsonrpc: "2.0",
      });
    }
  }
});

export default router;
