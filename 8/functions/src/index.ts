
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();
const db = admin.firestore();

export const generatePayslip = functions.https.onCall(async (data, context) => {
  const { employeeId, month } = data;
  const empRef = db.doc(`employees/${employeeId}`);
  const empDoc = await empRef.get();

  if (!empDoc.exists) throw new functions.https.HttpsError("not-found", "Employee not found");
  const emp = empDoc.data();

  if (!emp || !emp.salaryStructureId) {
     throw new functions.https.HttpsError("not-found", "Employee salary structure not defined");
  }

  const structureDoc = await db.doc(`salaryStructures/${emp.salaryStructureId}`).get();
  if (!structureDoc.exists) throw new functions.https.HttpsError("not-found", "Salary Structure not found");

  const salary = structureDoc.data();
  if (!salary) {
      throw new functions.https.HttpsError("not-found", "Salary Structure data is empty");
  }

  const basic = salary.basic;
  const hra = (salary.hraPercent / 100) * basic;
  const deductionTotal = salary.deductions.reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const netPay = basic + hra - deductionTotal;

  await db.doc(`payslips/${month}_${employeeId}`).set({
    employeeId,
    name: emp.name,
    month,
    basic,
    hra,
    deductions: deductionTotal,
    netPay,
    approved: false,
    date: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, netPay };
});
