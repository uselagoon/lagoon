package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"text/template"
)

type addAdmintoOrganizationUser struct {
	Id           string `json:"id"`
	Email        string `json:"email"`
	Organization int    `json:"organization"`
	Role         string `json:"role"`
}

type addAdminToOrganizationResource struct {
	Id      int    `json:"id"`
	Type    string `json:"type"`
	Details string `json:"details"` // stores the org name
}

// There is also a third payload struct called "linkedResource" which we could use, but it seems redundant

type addAdminToOrganization struct {
	Meta struct {
		Payload struct {
			AddAdminToOrganizationEmail bool                           `json:"addAdminToOrganizationEmail"`
			User                        addAdmintoOrganizationUser     `json:"user"`
			Resource                    addAdminToOrganizationResource `json:"resource"`
		} `json:"payload"`
	} `json:"meta"`
}

// These are the basic details that should be piped to the email template
type UseractionEmailDetails struct {
	Name    string
	Email   string
	Role    string
	Orgname string
}

// SendToEmail .
func (h *Messaging) useractionEmailTemplate(details *UseractionEmailDetails) (string, string, string, string, string, error) {

	emoji := infoEmoji
	color := "#E8E8E8"

	var mainHTML, plainText, subject, plainTextTpl, mainHTMLTpl string

	subject = fmt.Sprintf("User %s role updated for Organization: %v", details.Name, details.Orgname)

	// let's load the email templates from dist
	// load the file from disk

	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been assigned the role of 
  <strong>{{.Role}}</strong> in the organization <strong>{{.Orgname}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	mainHTMLTpl, err := templateGenerator(content, h.EmailBase64Logo)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}
	plainTextTpl = `{{.Name}} granted role {{.Role}} on organization {{.Orgname}}`

	var body bytes.Buffer
	t, _ := template.New("email").Parse(mainHTMLTpl)
	err = t.Execute(&body, details)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}

	mainHTML += body.String()

	var plainTextBuffer bytes.Buffer
	t, _ = template.New("email").Parse(plainTextTpl)
	err = t.Execute(&plainTextBuffer, details)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating plaintext template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}
	plainText += plainTextBuffer.String()
	if subject == "" {
		subject = plainText
	}
	return emoji, color, subject, mainHTML, plainText, nil
}

func (h *Messaging) handleUserActionToEmail(notification *Notification, rawPayload []byte) error {
	var payload addAdminToOrganization

	if err := json.Unmarshal(rawPayload, &payload); err != nil {
		return err
	}

	// let's check if we need to send an email
	if !payload.Meta.Payload.AddAdminToOrganizationEmail {
		if h.EnableDebug {
			log.Printf("Skipping email for addAdminToOrganization event user:%s\n", payload.Meta.Payload.User.Email)
		}
		return nil
	} else {
		if h.EnableDebug {
			log.Printf("Sending email for addAdminToOrganization event user:%s\n", payload.Meta.Payload.User.Email)
		}
	}

	// let's grab ourselves the mailer templates
	_, _, subject, mainHTML, plainText, err := h.useractionEmailTemplate(&UseractionEmailDetails{
		Name:    payload.Meta.Payload.User.Email,
		Email:   payload.Meta.Payload.User.Email,
		Role:    payload.Meta.Payload.User.Role,
		Orgname: payload.Meta.Payload.Resource.Details,
	})

	if err != nil {
		return fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", payload.Meta.Payload.User.Email, payload.Meta.Payload.User.Role, err)
	}

	// now we can send the email
	mainHTMLBuffer := bytes.Buffer{}
	mainHTMLBuffer.WriteString(mainHTML)
	err = h.deliverEmail(payload.Meta.Payload.User.Email, subject, plainText, mainHTMLBuffer)
	if err != nil {
		return fmt.Errorf("error sending email for addAdminToOrganization event %s and project %s: %v", payload.Meta.Payload.User.Email, payload.Meta.Payload.User.Role, err)
	}
	return nil
}
