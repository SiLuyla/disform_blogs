So you run a Discord server and you need to collect information from your members.
Maybe you are screening new applicants, gathering feedback, or running an event
signup.

You could use Google Forms and manually copy things over. You could use a bot that
DM's everyone individually. Or you could just use DisForm and have responses show
up directly in your Discord channel.

This is the fastest way to get started.

## What DisForm actually does

DisForm is a web app that lets you create forms and send the responses straight to
a Discord channel via webhook. No bots to invite, no commands to remember, no
coding.

The flow is simple:

1. You create a form on the DisForm website
2. You add questions (text, multiple choice, checkboxes, file uploads, etc.)
3. You configure a Discord webhook URL
4. You share the form link with your community
5. Responses appear in your Discord channel in real time

That is literally it.

## Creating your account

You do not even need to create a separate account. DisForm uses Discord login, so
you just click the login button and authorize with your Discord account. No email
verification, no password to remember.

Go to the DisForm website and click "Build Your First Form"

## Making your first form

Once you are logged in, click "New Form" on the dashboard. You will see a blank
form editor with a title, description, and an empty question list.

Give your form a title. Something like "Member Application" or "Event Feedback".
The description is optional but helpful if you want to explain what the form is
for before people start filling it out.

Now click "Add Question". You will see a list of question types:

- **Short Text** ~ single line answers, good for names and Discord tags
- **Long Text** ~ paragraph answers, good for explanations and feedback
- **Multiple Choice** ~ pick one option from a list
- **Checkboxes** ~ pick multiple options
- **Dropdown** ~ select from a dropdown menu
- **Linear Scale** ~ rate something on a numeric scale
- **Date / Time** ~ collect dates and times
- **Image Upload** ~ let people attach screenshots or files

Pick whichever makes sense for your first question and type it in.

## Setting up the Discord webhook

In your Discord server, go to Server Settings → Integrations → Webhooks. Create a
new webhook, give it a name and a channel, and copy the URL.

Back in the DisForm editor, paste that webhook URL into the Webhook URL field. Now
every time someone submits your form, the response will be posted to that channel
automatically.

## Sharing your form

Once your form is ready, click "Publish" and then copy the share link. Your form
is now live at a URL like `disform.my.id/f/12345`.

Post that link in your Discord server, on social media, or wherever your audience
is. Anyone with the link can fill out the form, even if they do not have a Discord
account (unless you require Discord login, which is a toggle in the settings).

## Seeing responses in real time

While someone is filling out your form, you can watch responses come in on the
DisForm dashboard. But the real magic is that they also show up in your Discord
channel instantly through the webhook.

The Discord message includes the respondent's Discord username and avatar, so you
know who submitted what. If you collect emails, that shows up too.

## What to try next

Once you have your first form running, here are a few things to experiment with:

- Turn on "Require Discord Login" to only accept responses from server members
- Add a confirmation message that people see after submitting
- Set a closing date so the form auto-closes after a deadline
- Enable captcha verification to block bots
- Export your responses as a CSV file from the dashboard

That is seriously all there is to it. Five minutes, maybe less.

DisForm was built specifically for Discord communities that got tired of juggling
Google Forms and spreadsheets. Everything goes straight to your server, you never
leave Discord to check results, and it costs exactly nothing.
