---
layout: blog
permalink: /blog/
title: "Blog"
excerpt: "York Developers Blog Articles"
---

<section class="our_blog" id="blog">
    <div class="container">
        <div class="row">
            <div class="col-lg-12 text-center">
                <h2>Blog</h2>
                <hr class="star-primary">
            </div>
        </div>
        <div class="row">

            {% for post in site.posts %}
                {% if post.categories contains 'Blog' %}
                    {% include blog.html %}
                {% endif %}
            {% endfor %}

        </div>
    </div>
</section>