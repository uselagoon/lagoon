package handler

import (
	"bytes"
	"crypto/tls"
	"fmt"
	gomail "gopkg.in/mail.v2"
	"strconv"
)

// This file contains the functionality for the Messanging object
// importantly, it contains the delivery functionality - and allows for the overriding of
// the delivery method to allow for testing and mocking

type DeliverEmailType func(h *Messaging, emailAddress string, subject string, plainText string, htmlMessage bytes.Buffer) error

// deliverEmail sends an email using the gomail package without adding any additional formatting
// it uses the EmailDeliveryFunction if set, otherwise it defaults to deliverEmailDefault
// this allows us to set custom email delivery functions for testing or other purposes
func (h *Messaging) deliverEmail(emailAddress string, subject string, plainText string, htmlMessage bytes.Buffer) error {
	if h.EmailDeliveryFunction == nil {
		return fmt.Errorf("email delivery function is not set, email cannot be sent")
	}
	return h.EmailDeliveryFunction(h, emailAddress, subject, plainText, htmlMessage)
}

// deliverEmailWithCustomFunction is the standard implementation of the email delivery function
func deliverEmailDefault(h *Messaging, emailAddress string, subject string, plainText string, htmlMessage bytes.Buffer) error {
	m := gomail.NewMessage()
	m.SetHeader("From", h.EmailSender)
	m.SetHeader("To", emailAddress)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", plainText)
	m.AddAlternative("text/html", htmlMessage.String())
	sPort, _ := strconv.Atoi(h.EmailPort)
	if h.EmailSenderPassword != "" {
		d := gomail.NewDialer(h.EmailHost, sPort, h.EmailUsername, h.EmailSenderPassword)
		d.TLSConfig = &tls.Config{InsecureSkipVerify: h.EmailInsecureSkipVerify}
		if err := d.DialAndSend(m); err != nil {
			return err
		}
	} else {
		d := gomail.Dialer{Host: h.EmailHost, Port: sPort, SSL: h.EmailSSL}
		d.TLSConfig = &tls.Config{InsecureSkipVerify: h.EmailInsecureSkipVerify}
		if err := d.DialAndSend(m); err != nil {
			return err
		}
	}
	return nil
}

// simpleMail is a helper function to send a simple email with HTML and plain text content
// it uses the deliverEmail function to send the email, formatting the HTML content as needed
func (h *Messaging) simpleMail(emailAddr, subject, mainHTML, plainText string) error {
	// now we can send the email
	mainHTMLBuffer := bytes.Buffer{}
	mainHTMLBuffer.WriteString(mainHTML)
	err := h.deliverEmail(emailAddr, subject, plainText, mainHTMLBuffer)
	if err != nil {
		return err
	}
	return nil
}
