/* eslint-disable no-console */
import * as postmark from "postmark";

// async..await is not allowed in global scope, must use a wrapper
export async function sendPostmarkInvitationEmail(
  mailOptions: postmark.Models.Message
): Promise<postmark.Models.MessageSendingResponse> {
  // Setup the Postmark client

  let mailSentResponse;

  if (process.env.POSTMARK_API_TOKEN) {
    const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

    // I believe we can provide a callback to client.sendEmail that uses the response
    // as well

    mailSentResponse = await client
      .sendEmail(mailOptions)
      .then((data) => {
        console.log("IS THERE ANY DATA?", { data });
        if (!data.Message || data.Message !== "OK") {
          throw Error(
            "An error occurred sending confifmation message. Please delete record and try again."
          );
        }
        return data;
      })
      .catch((error) => error);

    if (process.env.NODE_ENV === "production") {
      console.log("CHECK TOTAL RESPONSE", { mailSentResponse });
      console.log("Message sent: %s", mailSentResponse.To);

      console.log("Confirmation URI: %s", mailOptions.HtmlBody);
    }
    return mailSentResponse;
  } else {
    throw Error(
      "Postmark client API token is undefined. Please add token to your environment variables."
    );
  }
}
