import {getBusiness,json,canCharge,runtime} from '../../commerce/business';
export const dynamic='force-dynamic';
export async function GET(){const b=await getBusiness();return json({brand:'Heartfold Ink',legalName:b.legalName,organisationNumber:b.organisationNumber,address:b.address,contactEmail:b.contactEmail,acceptingRequests:b.acceptingRequests,revisionDays:b.revisionDays,revisions:b.revisions,retentionDays:b.retentionDays,paymentsAvailable:canCharge(b),emailAvailable:!!(runtime().RESEND_API_KEY&&runtime().MAIL_FROM)})}
