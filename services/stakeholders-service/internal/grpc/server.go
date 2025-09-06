// services/stakeholders-service/internal/grpc/server.go
package grpc

import (
	"context"
	pb "github.com/tijanicica/soa-project/protos"
	"github.com/tijanicica/soa-project/services/stakeholders-service/internal/store"
)

type Server struct {
	pb.UnimplementedStakeholderServiceServer
	store *store.Store
}

func NewServer(store *store.Store) *Server {
	return &Server{store: store}
}

func (s *Server) GetUsersInfo(ctx context.Context, req *pb.GetUsersInfoRequest) (*pb.GetUsersInfoResponse, error) {
	usersInfo, err := s.store.GetUsersInfoByIDs(req.UserIds)
	if err != nil {
		return nil, err
	}

	responseUsers := make(map[int64]*pb.UserInfo)
	for id, info := range usersInfo {
		responseUsers[id] = &pb.UserInfo{
			Id:              info.ID,
			Username:        info.Username,
			FirstName:       info.FirstName.String,
			ProfileImageUrl: info.ProfileImageURL.String,
		}
	}

	return &pb.GetUsersInfoResponse{Users: responseUsers}, nil
}
