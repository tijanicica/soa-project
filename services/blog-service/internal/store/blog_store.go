package store

import (
	"bytes"
	"database/sql"
	"strings"
	"time"

	"github.com/tijanicica/soa-project/services/blog-service/internal/model"
)

func (s *Store) CreateBlog(blog *model.Blog, imageURLs []string) (*model.Blog, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}

	res, err := tx.Exec(`
		INSERT INTO blogs (author_id, title, description_markdown, creation_date, last_modified_date) 
		VALUES (?, ?, ?, ?, ?)
	`, blog.AuthorID, blog.Title, blog.DescriptionMarkdown, blog.CreationDate, blog.CreationDate)

	if err != nil {
		tx.Rollback() // Poništi transakciju ako dođe do greške
		return nil, err
	}

	blogID, _ := res.LastInsertId()
	blog.ID = blogID

	if len(imageURLs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO blog_images (blog_id, image_url) VALUES (?, ?)")
		if err != nil {
			tx.Rollback()
			return nil, err
		}
		defer stmt.Close()

		for _, url := range imageURLs {
			if _, err := stmt.Exec(blogID, url); err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	blog.ImageURLs = imageURLs
	return blog, nil
}

func (s *Store) AddComment(comment *model.Comment) (*model.Comment, error) {
	res, err := s.db.Exec(`
		INSERT INTO comments (blog_id, author_id, text, creation_time, last_modified_time) 
		VALUES (?, ?, ?, ?, ?)
	`, comment.BlogID, comment.AuthorID, comment.Text, comment.CreationTime, time.Now())
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	comment.ID = id
	return comment, nil
}

func (s *Store) ToggleLike(blogID, userID int64) (string, error) {
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM likes WHERE blog_id = ? AND user_id = ?)", blogID, userID).Scan(&exists)
	if err != nil {
		return "", err
	}

	if exists {
		_, err := s.db.Exec("DELETE FROM likes WHERE blog_id = ? AND user_id = ?", blogID, userID)
		if err != nil {
			return "", err
		}
		return "unliked", nil
	} else {
		// Ako ne postoji, dodajemo ga
		_, err := s.db.Exec("INSERT INTO likes (blog_id, user_id) VALUES (?, ?)", blogID, userID)
		if err != nil {
			return "", err
		}
		return "liked", nil
	}
}

func (s *Store) GetLikesCount(blogID int64) (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE blog_id = ?", blogID).Scan(&count)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, err
	}
	return count, nil
}

func (s *Store) GetAllBlogs() ([]*model.BlogWithStats, error) {
	query := `
		SELECT 
			b.id, b.author_id, b.title, b.description_markdown, b.creation_date, b.last_modified_date,
			COALESCE(lc.likes_count, 0),
			COALESCE(cc.comments_count, 0),
			COALESCE(img.image_urls, '')
		FROM blogs b
		LEFT JOIN (
			SELECT blog_id, COUNT(*) as likes_count
			FROM likes GROUP BY blog_id
		) lc ON b.id = lc.blog_id
		LEFT JOIN (
			SELECT blog_id, COUNT(*) as comments_count
			FROM comments GROUP BY blog_id
		) cc ON b.id = cc.blog_id
		LEFT JOIN (
			SELECT blog_id, GROUP_CONCAT(image_url) as image_urls
			FROM blog_images GROUP BY blog_id
		) img ON b.id = img.blog_id
		ORDER BY b.creation_date DESC;
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blogs []*model.BlogWithStats
	for rows.Next() {
		bws := &model.BlogWithStats{}
		var imageUrlsStr string

		err := rows.Scan(
			&bws.Blog.ID,
			&bws.Blog.AuthorID,
			&bws.Blog.Title,
			&bws.Blog.DescriptionMarkdown,
			&bws.Blog.CreationDate,
			&bws.Blog.LastModifiedDate,
			&bws.Stats.LikesCount,
			&bws.Stats.CommentsCount,
			&imageUrlsStr,
		)
		if err != nil {
			return nil, err
		}

		if imageUrlsStr != "" {
			bws.Blog.ImageURLs = strings.Split(imageUrlsStr, ",")
		} else {
			bws.Blog.ImageURLs = []string{}
		}

		blogs = append(blogs, bws)
	}
	return blogs, nil
}

func (s *Store) GetCommentsForBlog(blogID int64) ([]*model.Comment, error) {
	// Redosled je DESC da bi najnoviji komentari bili prvi.
	rows, err := s.db.Query(`
		SELECT 
			id, 
			blog_id, 
			author_id, 
			text, 
			creation_time, 
			last_modified_time 
		FROM 
			comments 
		WHERE 
			blog_id = ? 
		ORDER BY 
			creation_time DESC
	`, blogID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*model.Comment
	for rows.Next() {
		comment := &model.Comment{}
		err := rows.Scan(
			&comment.ID,
			&comment.BlogID,
			&comment.AuthorID,
			&comment.Text,
			&comment.CreationTime,
			&comment.LastModifiedTime,
		)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

func (s *Store) UpdateBlog(blog *model.Blog, newImageURLs []string, imagesToDelete []string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}

	var query bytes.Buffer
	query.WriteString("UPDATE blogs SET last_modified_date = ?")
	args := []interface{}{time.Now()}

	if blog.Title != "" {
		query.WriteString(", title = ?")
		args = append(args, blog.Title)
	}
	if blog.DescriptionMarkdown != "" {
		query.WriteString(", description_markdown = ?")
		args = append(args, blog.DescriptionMarkdown)
	}

	if len(args) > 1 || len(newImageURLs) > 0 || len(imagesToDelete) > 0 {
		query.WriteString(" WHERE id = ? AND author_id = ?")
		args = append(args, blog.ID, blog.AuthorID)

		res, err := tx.Exec(query.String(), args...)
		if err != nil {
			tx.Rollback()
			return err
		}

		rowsAffected, err := res.RowsAffected()
		if err != nil {
			tx.Rollback()
			return err
		}
		if rowsAffected == 0 {
			tx.Rollback()
			return sql.ErrNoRows // Vraćamo grešku ako blog nije nađen ili korisnik nije vlasnik
		}
	}

	if len(imagesToDelete) > 0 {
		deleteQuery := "DELETE FROM blog_images WHERE blog_id = ? AND image_url IN (?" + strings.Repeat(",?", len(imagesToDelete)-1) + ")"

		deleteArgs := make([]interface{}, len(imagesToDelete)+1)
		deleteArgs[0] = blog.ID
		for i, url := range imagesToDelete {
			deleteArgs[i+1] = url
		}

		_, err = tx.Exec(deleteQuery, deleteArgs...)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	if len(newImageURLs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO blog_images (blog_id, image_url) VALUES (?, ?)")
		if err != nil {
			tx.Rollback()
			return err
		}
		defer stmt.Close()

		for _, url := range newImageURLs {
			if _, err := stmt.Exec(blog.ID, url); err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}
