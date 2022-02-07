package com.stasa.services;

import com.stasa.entities.Invitation;
import com.stasa.repositories.InvitationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InvitationService {
    @Autowired
    private InvitationRepo invitationRepo;

    public String inviteUserToGroup(Invitation invitation) {
        invitationRepo.save(invitation);
        return "Invitation has been sent!";
    }
}