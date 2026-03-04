INSERT INTO "Client" ("id","name","company","email","phone","retainerUsd","createdAt","updatedAt") VALUES
('cl1','Alyssa Wong','Northline Manufacturing','alyssa@northline.example','+1 (843) 555-0112',25000,datetime('now'),datetime('now')),
('cl2','Jenna Miles','Individual','jmiles@example.com','+1 (843) 555-0138',5000,datetime('now'),datetime('now')),
('cl3','Marcus Cole','Barnes Mutual','mcole@barnesmutual.example','+1 (843) 555-0154',12000,datetime('now'),datetime('now')),
('cl4','Joe E','Individual','','',0,datetime('now'),datetime('now'));

INSERT INTO "Case" ("id","caseCode","title","status","priority","dueDate","investigator","createdAt","updatedAt","clientId") VALUES
('ca1','C-1001','Corporate Fraud Allegation','ACTIVE','URGENT','2026-03-02 00:00:00','David Leaird',datetime('now'),datetime('now'),'cl1'),
('ca2','C-1002','Missing Person Locate','PENDING','HIGH','2026-02-28 00:00:00','R. Patel',datetime('now'),datetime('now'),'cl2'),
('ca3','C-1003','Workers Comp Surveillance','ACTIVE','MEDIUM','2026-03-05 00:00:00','K. Nguyen',datetime('now'),datetime('now'),'cl3'),
('ca4','C-1004','Divorce Investigation','INTAKE','MEDIUM',NULL,'David Leaird',datetime('now'),datetime('now'),'cl4');

INSERT INTO "Contractor" ("id","contractorCode","name","role","contractType","hourlyRateUsd","createdAt","updatedAt") VALUES
('ct1','EMP-1099-1','R. Patel','Field Investigator','C1099',85,datetime('now'),datetime('now')),
('ct2','EMP-1099-2','K. Nguyen','Surveillance Investigator','C1099',95,datetime('now'),datetime('now'));

INSERT INTO "TimeEntry" ("id","entryCode","workDate","hours","notes","billableAmountUsd","createdAt","caseId","contractorId") VALUES
('te1','TE-3001','2026-02-25 00:00:00',6.5,'Skip trace + records pull',552.5,datetime('now'),'ca2','ct1'),
('te2','TE-3002','2026-02-25 00:00:00',8.0,'Field surveillance shift',760,datetime('now'),'ca3','ct2');

INSERT INTO "Expense" ("id","expenseCode","category","amountUsd","spentDate","status","notes","createdAt","caseId","contractorId") VALUES
('ex1','EX-4101','Mileage',74.2,'2026-02-25 00:00:00','SUBMITTED','Vehicle mileage reimbursement',datetime('now'),'ca2','ct1'),
('ex2','EX-4102','Equipment',189.99,'2026-02-24 00:00:00','APPROVED','Replacement battery pack',datetime('now'),'ca3','ct2');

INSERT INTO "Invoice" ("id","invoiceCode","amountUsd","status","issuedDate","createdAt","updatedAt","clientId","caseId") VALUES
('in1','INV-9201',6800,'SENT','2026-02-22 00:00:00',datetime('now'),datetime('now'),'cl1','ca1'),
('in2','INV-9202',4200,'PAID','2026-02-20 00:00:00',datetime('now'),datetime('now'),'cl3','ca3'),
('in3','INV-9203',1500,'DRAFT','2026-02-25 00:00:00',datetime('now'),datetime('now'),'cl2','ca2');
