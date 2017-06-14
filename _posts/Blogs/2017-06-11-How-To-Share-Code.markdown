---
layout: blog
title:  "How to Share Code"
date:   2017-06-11 15:08:10 -0500
img: img/blog/york-dot-developers-small.png
category: Blog
author: David Betteridge
author-bio:  is a Co-Founder of YorkDevelopers.org, a dedicated group of software engineers in York providing meetups for technology professionals in York.  David is an accomplished Software Architect with a proven track record of designing scalable solutions.
---

### Sharing Your Code
Like many open source projects and communities, we use “GitHub” to store, version and share our source code.
At the end of each code dojo session we would like you to add your code to our repository so that others can learn by viewing all the various solutions. As using GitHub for the first time can be quite daunting I’ve put this step by step guide to get you started.

#### Registering
In your browser go to https://github.com/ and complete the form allowing you to sign up.

![Screenshot 1]({{ site.url }}/img/blog/screenshots/share-your-code-1.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Note: The username will be used to form part of the URL to your source code.   For example, one of my repositories has the URL https://github.com/davidBetteridge/TaskVisualiser as my username is davidbetteridge.

After your username, has been accepted you will be asked what type of plan you wish to use.  For now, pick the Unlimited public repositories for free option.

![Screenshot 2]({{ site.url }}/img/blog/screenshots/share-your-code-2.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Warning: Picking the free plan only allows you to create public repositories.  This means that any source code you store in github will be visible to the entire world.   This includes any files you check in with passwords in!

#### Software

The next task is to install some software on your development machine.  Although graphical tools do exist, most developers use the command line interface.

First make sure that git isn’t already installed by opening a command prompt and typing “git”.  If it’s already installed, then you can skip the rest of this section.

In your browser visit https://git-scm.com/downloads and click the icon for your operating system.

![Screenshot 3]({{ site.url }}/img/blog/screenshots/share-your-code-3.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Download and install the version for your operating system.  (For windows this is just a case of following the wizard, I haven’t tried it on Linux or Macs.)

#### The Process
Now we are ready to start adding some source code.  There are a few steps to carry out so it seems quite complicated at first but you will soon get used to it.

![Screenshot 4]({{ site.url }}/img/blog/screenshots/share-your-code-4.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

#### Fork 
When you “Fork” the source code it means that you are taking you own copy so that you can work in complete isolation to the original code.

In your browser visit the URL https://github.com/yorkCodeDojo and find the repository for the code you were working on during the code dojo.

![Screenshot 5]({{ site.url }}/img/blog/screenshots/share-your-code-5.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Once you are viewing the repository, click the **“Fork”** button

![Screenshot 6]({{ site.url }}/img/blog/screenshots/share-your-code-6.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

This should create a copy of the repository, but within your own account.

![Screenshot 7]({{ site.url }}/img/blog/screenshots/share-your-code-7.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}
 
#### Clone
Next is to clone the code from your GitHub account onto your development machine.

Click the **Clone or Download** option and then copy the URL onto your clipboard

![Screenshot 8]({{ site.url }}/img/blog/screenshots/share-your-code-8.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Open a command prompt on your development machine, ensure you are in the folder in which you wish to create the code and type git clone followed by the url

![Screenshot 9]({{ site.url }}/img/blog/screenshots/share-your-code-9.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

If it all goes to plan, then it should download all the current code in the repository onto your machine

![Screenshot 10]({{ site.url }}/img/blog/screenshots/share-your-code-10.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

#### Add
Now you can add your pair’s source code to your local copy.    Begin by making a folder based on your first names and language used. For example, **david_daniel_fsharp**.  Try to avoid non-standard characters such a # sign.

Once you have added your source code to the folder use the git add command.   You can either use **git add .** to add all files,  or **git add filename** to add individual files

![Screenshot 11]({{ site.url }}/img/blog/screenshots/share-your-code-11.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Type **git status** to view the files you have just added.  If you have added files by accident, then use the **git reset** command.

![Screenshot 12]({{ site.url }}/img/blog/screenshots/share-your-code-12.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}


#### Local Commit
The next step is to confirm your changes within the source control system on your development machine.

For this type **git commit -m “Message”**  where message is a comment you wish to store against the check in.

![Screenshot 13]({{ site.url }}/img/blog/screenshots/share-your-code-13.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

#### Push
Currently your source code is only on your local machine.  You need to also push it up to your account on GitHub.  For this we use the git push command.

![Screenshot 14]({{ site.url }}/img/blog/screenshots/share-your-code-14.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

If you now look at your account on git hub you should see the code, you have just added.

![Screenshot 15]({{ site.url }}/img/blog/screenshots/share-your-code-15.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

#### Pull Request

Finally, you need to request that your changes are pulled into the original repository on the York code dojo account

Click the New pull request button

![Screenshot 16]({{ site.url }}/img/blog/screenshots/share-your-code-16.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

And then Create pull request

![Screenshot 17]({{ site.url }}/img/blog/screenshots/share-your-code-17.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

Add a comment and then click Create Pull request (again!)

![Screenshot 18]({{ site.url }}/img/blog/screenshots/share-your-code-18.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}

I should now get an email telling me there is a new pull request.  Once I’ve reviewed it I’ll click Merge and your source code will be included.

![Screenshot 19]({{ site.url }}/img/blog/screenshots/share-your-code-19.png){:width="70%" max-width="100%" display="block" margin-left="auto" margin-right="auto"}