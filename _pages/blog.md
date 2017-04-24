---
layout: blog
permalink: /blog/
title: "Blog"
excerpt: "York Developers Blog Articles"
---

{% for post in site.posts %}
    {% if post.categories contains 'Blog' %}
        {% include blog.html %}
    {% endif %}
{% endfor %}