export function customEmail({ subject, content }) {
  return `
 <!DOCTYPE html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <title></title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style>
      table,
      td,
      div,
      h1,
      p,
      button {
        font-family: "Work Sans", "Roboto", sans-serif; 
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0">
    <table
      style="
        width: 100%;
        border-collapse: collapse;
        border: 0;
        border-spacing: 0;
        background: #ffffff;
      "
    >
      <table
        style="background: #f4f4ff; padding: 20px; width: 640px; margin: auto"
      >
        <tr>
          <td align="center" style="padding: 0">
            <table
              style="
                width: 550px;
                border-collapse: collapse;
                border-spacing: 0;
                text-align: left;
              "
            >
              <tr>
                <td style="padding: 20px 10px 20px">
                  <table
                    style="
                      width: 100%;
                      border-collapse: collapse;
                      border: 0;
                      border-spacing: 0;
                    "
                  >
                                        <tr>
                      <td style="color: #121127; padding: 40px 10px">
                        <table
                          style="
                            border-collapse: collapse;
                            border-spacing: 0;
                            width: auto;
                            margin: 0 auto;
                          "
                        >
                          <tr>
                            <td>
                              <img
                                style="width: 132px; height: 38px"
                                src="/"
                              />
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style="
                          color: #181820;
                          padding: 30px;
                          background: #ffffff;
                        "
                      >
                        <h1
                          style="
                            font-weight: 600;
                            font-size: 20px;
                            line-height: 140%;
                            margin: 0 0 30px 0;
                          "
                        >
                          ${subject}
                        </h1>

				              		${content}
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align: center; font-size: 14px">
                        <p style="color: #181820; margin: 30px auto">
                          Get the most out of amealp by using our mobile app.
                        </p>
                        <table
                          style="
                            margin: 0 auto;
                            border-collapse: collapse;
                            border-spacing: 0;
                          "
                        >
                          <tr>
                            <td>
                              <a
                                href="https://apps.apple.com/ng/app/amealp-flip-cards/id1605670456"
                                target="_blank"
                              >
                                <img
                                  style="
                                    width: 106px;
                                    height: 32px;
                                    margin-right: 20px;
                                  "
                                  src="https://res.cloudinary.com/yoyoplenty/image/upload/v1720085450/apple-store_mgxw7w.png"
                                />
                              </a>
                            </td>
                            <td>
                              <a
                                href="https://play.google.com/store/apps/details?id=com.easyflipMobile&hl=en&gl=US"
                                target="_blank"
                              >
                                <img
                                  style="width: 106px; height: 32px"
                                  src="https://res.cloudinary.com/yoyoplenty/image/upload/v1720085450/gogole-play_he2tli.png"
                                />
                              </a>
                            </td>
                          </tr>
                        </table>
                        <table
                          style="
                            margin: 0 auto;
                            border-collapse: collapse;
                            border-spacing: 0;
                          "
                        >
                          <tr>
                            <td>
                              <table
                                style="
                                  border-collapse: collapse;
                                  border-spacing: 0;
                                  margin-top: 15px;
                                "
                              >
                                <tr>
                                  <td>
                                    <a
                                      href="https://wa.link/9iud8g"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        style="width: 32px; height: 32px"
                                        src="https://res.cloudinary.com/yoyoplenty/image/upload/v1720085013/wa-logo_apn5g0.png"
                                      />
                                    </a>
                                  </td>
                                  <td style="padding: 0 10px">
                                    <a
                                      href="https://www.facebook.com/EasyflipN?mibextid=ZbWKwL"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        style="width: 32px; height: 32px"
                                        src="https://res.cloudinary.com/yoyoplenty/image/upload/v1720085013/fb-logo_okugjn.png"
                                      />
                                    </a>
                                  </td>
                                  <td>
                                    <a
                                      href="http://www.instagram.com/easyflipng"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        style="width: 32px; height: 32px"
                                        src="https://res.cloudinary.com/yoyoplenty/image/upload/v1720085014/ig-logo_yjekey.png"
                                      />
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p
                          style="
                            color: #3e3e45;
                            margin: 20px auto;
                            line-height: 21px;
                          "
                        >
                          Have Questions? Contact us at
                          <a
                            style="color: #d45d58; text-decoration: underline"
                            href="mailto:support@amealp.in"
                            target="_blank"
                            >support@amealp.in</a
                          >. If you'd rather not receive this kind of email,
                          Don’t want any more emails from amealp?
                          <span
                            style="color: #d45d58; text-decoration: underline"
                            >Unsubscribe.</span
                          >
                          <br /><br />
                          © ${new Date().getFullYear()} AMealP. All rights reserved
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </table>
  </body>
</html>
  `;
}
